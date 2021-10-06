
# shellcheck shell=bash
# bootstrap environment script to include non-RDev developer files

RDEV_RHOLANG_DIR=$(pwd)/../../rholang
export RDEV_RHOLANG_DIR

RDEV_ACTIONS_DIR=$(pwd)/../../actions
export RDEV_ACTIONS_DIR

# shellcheck disable=SC1091
source ../../rdev.bashrc
