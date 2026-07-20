{
  description = "Next.js Development Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        nodejs_22
        pnpm
        yarn
        postgresql_16

        (writeShellScriptBin "db-init" ''
          if [ ! -d "$PGDATA" ]; then
            echo "initdb: Initializing local database cluster..."
            initdb --no-locale -D "$PGDATA"
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
        
        echo "⚛️  Next.js + Postgres environment armed."
        echo "💡 Type 'db-start' to engage the database, 'db-stop' to kill it."
      '';
    };
  };
}
