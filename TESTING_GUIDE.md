# Fold VR Controller Testing Guide

This guide will help you test the controller detection improvements in Fold VR on Quest 3 devices.

## What's Been Improved

1. **Direct WebXR Input Source Access**
   - Added direct access to WebXR input sources via `session.inputSources`
   - Implemented hybrid detection combining both react-three/xr and direct WebXR sources
   - Enhanced controller reconnection logic

2. **Enhanced Movement Controls**
   - Multiple input methods for movement (WebXR axes, react-three/xr axes, button mapping)
   - Fallback to head-tilt based movement when controllers aren't detected
   - Detailed logging of input sources and movement methods

3. **Improved Visual Feedback**
   - Enhanced VRConsole showing controller connection status
   - Source tracking to distinguish between react-three/xr and direct WebXR controllers
   - Color-coded feedback for controller state

## Testing Procedure

### 1. Initial Controller Detection

1. Launch the application on Quest 3
2. Check if controllers are detected immediately in non-immersive mode
3. Enter immersive mode and verify controllers remain detected
4. Look at the VRConsole to confirm controller status (should show "CONNECTED")
5. Note which API is detecting the controllers (WebXR, react-xr, or both)

### 2. Controller Input Testing

1. Move using the left thumbstick and verify movement works
2. Check the VRConsole to see which axes are being used (should show active axes)
3. Press various buttons and verify they register in the VRConsole
4. Test menu button functionality (right controller select)
5. Test back button functionality (right controller squeeze)

### 3. Controller Reconnection

1. Turn off one controller
2. Wait for the VRConsole to show "DISCONNECTED"
3. Turn the controller back on
4. Verify it reconnects and shows "CONNECTED" again
5. Repeat with the other controller

### 4. Fallback Controls

1. Turn off both controllers
2. Verify the fallback head-tilt movement activates
3. Look down slightly to move forward
4. Look left/right while moving to turn
5. Turn controllers back on and verify normal controls resume

### 5. Edge Cases

1. Start the application with controllers off, then turn them on
2. Enter immersive mode with only one controller active
3. Rapidly turn controllers on/off to test reconnection stability
4. Test with different controller battery levels
5. Test after Quest 3 sleep/wake cycles

## Debugging Tips

- The VRConsole shows detailed information about controllers
- Look for the source of controller detection (WebXR, react-xr, or both)
- Check button indices and axes values to verify input is being received
- Movement method is displayed in the debug text (webxr-0,1, r3f-0,1, etc.)
- If controllers aren't detected, check battery levels and try restarting the headset

## Expected Results

- Controllers should be detected in both non-immersive and immersive modes
- Movement should work using the left controller thumbstick
- Menu and back buttons should function properly
- Controllers should reconnect automatically when turned back on
- Fallback controls should activate when controllers aren't detected
- VRConsole should show accurate controller status and input information

## Reporting Issues

If you encounter any issues during testing, please note:
1. Which test step failed
2. What was shown in the VRConsole
3. Controller detection source (WebXR, react-xr, or both)
4. Any error messages
5. Steps to reproduce the issue
