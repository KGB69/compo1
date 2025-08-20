# VR Controller Testing Guide

This guide explains how to test the VR controller improvements that have been implemented in the Fold VR application.

## Controller Features

### Menu Navigation
- **Menu Toggle**: Press the **Y button** (left controller) or **B button** (right controller) to toggle the menu
- **Menu Selection**: Use the **trigger** (right controller) to select menu items
- **Back Action**: Use the **grip button** (right controller) to go back or close menus

### Movement
- **Primary Movement**: Use the **left thumbstick** to move in the direction you're looking
- **Movement Speed**: Movement speed is calibrated for comfortable navigation

### VRConsole
- **Toggle Console**: Press the **X button** (left controller) or the **V key** on keyboard to toggle the VRConsole
- **Console Visibility**: A small indicator shows when the console is hidden
- **Debug Information**: The console shows controller status and movement information

## Testing Procedure

1. **Launch the Application**: Start the application and enter VR mode
2. **Test Menu Navigation**:
   - Press Y/B to open the menu
   - Use the trigger to select an item
   - Use the grip to go back
3. **Test Movement**:
   - Use the left thumbstick to move around
   - Verify movement direction matches thumbstick direction relative to where you're looking
   - Check that movement speed is comfortable
4. **Test VRConsole**:
   - Press X button to toggle the console
   - Verify the console shows/hides correctly
   - Check that the indicator appears when console is hidden
   - Verify controller status information is accurate

## Troubleshooting

If controllers aren't working as expected:

1. **Check Controller Connection**: Make sure controllers are properly connected and tracked
2. **Check Button Mappings**: Different VR headsets may have slightly different button mappings
3. **Check Console Logs**: Enable the VRConsole to see detailed logs about controller inputs
4. **Movement Issues**: If movement doesn't work with the thumbstick, the console will show which input method is being used

## Implementation Details

The controller improvements include:

- Enhanced controller detection using both react-three/xr and direct WebXR input sources
- Multiple fallback methods for movement input
- Button press detection with rising edge detection to prevent repeated triggers
- Event-based communication between GlobalVRInput and Player components
- Detailed logging and debugging information in the VRConsole
