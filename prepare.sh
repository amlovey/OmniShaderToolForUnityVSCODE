pushd ../shaderlab-language-server
sh build.sh
popd
rm -rf ./sls
mkdir ./sls
cp -r -f ../shaderlab-language-server/dist/release/* ./sls