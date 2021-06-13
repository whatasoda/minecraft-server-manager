#! /bin/bash

cat <<'EOF' > Makefile
####_MAKEFILE_####
EOF

sudo apt update && sudo apt-get install -y make && make init
