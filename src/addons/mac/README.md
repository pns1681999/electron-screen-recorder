The original `whisper-addon.node` built from [whisper.cpp](https://github.com/ggerganov/whisper.cpp) has the wrong path on macOS, so it should be modified by running the following commands:

```bash
# Check the module if it has "@rpath/libwhisper.dylib" path (which is incorrect)
otool -L whisper-addon.node

# Change "@rpath/libwhisper.dylib" to "@loader_path/libwhisper.dylib"
install_name_tool -change @rpath/libwhisper.dylib @loader_path/libwhisper.dylib whisper-addon.node

# Check if the change has been applied
otool -L whisper-addon.node
```
