{
  description = "Next.js Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    antigravity-nix = {
      url = "github:jacopone/antigravity-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, antigravity-nix }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {
      inherit system;
      config.allowUnFree = true;
    };

    aider-full = pkgs.aider-chat.overrideAttrs (old: {
      propagatedBuildInputs = old.propagatedBuildInputs ++ (with pkgs.python3Packages; [
        google-generativeai
        playwright
      ]);
    });

  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        nodejs_22
        pnpm
        yarn
        postgresql_16

        aider-full
        playwright-driver.browsers

        # antigravity-nix
        antigravity-nix.packages.${system}.google-antigravity-cli
        antigravity-nix.packages.${system}.default

        (writeShellScriptBin "db-init" ''
          if [ ! -d "$PGDATA" ]; then
            echo "initdb: Initializing local database cluster..."
            initdb -U postgres --no-locale -D "$PGDATA"
            echo "host all all 127.0.0.1/32 trust" >> "$PGDATA/pg_hba.conf"
          fi
        '')

        (writeShellScriptBin "db-start" ''
          db-init
          if ! pg_ctl status >/dev/null 2>&1; then
            echo "postgres: Starting server on port $PGPORT..."
            pg_ctl -l "$PGDATA/postgres.log" -o "-k $PGDATA -p $PGPORT" start
            sleep 1
            createdb -h localhost -p $PGPORT -U postgres next_app || true
          else
            echo "postgres: Server is already running."
          fi
        '')

        (writeShellScriptBin "db-stop" ''
          if pg_ctl status >/dev/null 2>&1; then
            echo "postgres: Stopping server..."
            pg_ctl -o "-k $PGDATA -p $PGPORT" stop
          else
            echo "postgres: No server running."
          fi
        '')
      ];
      shellHook = ''
        export NEXT_TELEMETRY_DISABLED=1
        
        # Environment variables for our compiled scripts to use
        export PGDATA="$PWD/.direnv/db"
        export PGPORT=54321
        export DATABASE_URL="postgresql://postgres@localhost:$PGPORT/next_app?sslmode=disable"

        export PLAYWRIGHT_BROWSERS_PATH=${pkgs.playwright-driver.browsers}
        export PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true
        
        echo "⚛️  Next.js + Postgres environment armed."
        echo "💡 Type 'db-start' to engage the database, 'db-stop' to kill it."
      '';
    };
  };
}
