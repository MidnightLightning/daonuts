#!/bin/bash

export NETWORK="development"
export ARAGON_ENS=0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1
export ENS=0x5f6f7e8cc7346a11ca2def8f827b7a0b612c56a1
export ROOT_NODE=0xbaa9d81065b9803396ee6ad9faedd650a35f2b9ba9849babde99d4cdbf705a2e
export REG_ROOT=0x69468d76e397ff6a3e5f0b6bb4912940f2cb1bc46f2a2997cefc3d92b5bdea29
export DIST_ROOT=0x3c29d24944d02f47733fa7e5e198a3e697566f69725817b5e549ab217413a35b

export DAO=$(dao new | awk 'NR>1 { if ($3 FS $4 == "Created DAO:") print $5 }')
echo Created DAO=$DAO

APP_INSTALLER=$(aragon deploy AppInstaller --init $ARAGON_ENS $ENS $ROOT_NODE | awk 'NR>1 { if ($3 FS $4 == "Successfully deployed") print $7 }')
echo Deployed APP_INSTALLER=$APP_INSTALLER
export APP_INSTALLER

dao acl grant $DAO $DAO APP_MANAGER_ROLE $APP_INSTALLER

echo "install apps"
truffle exec --network $NETWORK scripts/installApps.js

dao apps --all $DAO