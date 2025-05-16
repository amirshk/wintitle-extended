# WinTitle Extended

[![Version](https://img.shields.io/visual-studio-marketplace/v/AmirShaked.wintitle-extended)](https://marketplace.visualstudio.com/items?itemName=AmirShaked.wintitle-extended)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/AmirShaked.wintitle-extended)](https://marketplace.visualstudio.com/items?itemName=AmirShaked.wintitle-extended)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/AmirShaked.wintitle-extended)](https://marketplace.visualstudio.com/items?itemName=AmirShaked.wintitle-extended&ssr=false#review-details)

Appends the current Git branch name and optional custom name to the VSCode window title, making it easier to identify which branch and project you're working on across multiple VSCode windows.

## Why WinTitle Extended?

This extension was built specifically for engineers who:

- Work with multiple VSCode windows open on the same project simultaneously
- Need to quickly identify which window corresponds to which feature or task
- Often work on different folders or branches of the same project in parallel
- Practice "vibe coding" - working on 2 or more features at the same time

When you're deep in a coding flow, context switching between windows can break your concentration. WinTitle Extended helps you maintain that flow by making it instantly clear which window is which.

## Features

- **Dynamic Window Title**: Automatically updates the window title to include the current Git branch name
- **Custom Project Name**: Reads optional custom project name from `.vscode.name.json` file in workspace root
- **Status Bar Integration**: Shows branch status in the status bar with toggle functionality
- **Graceful Fallbacks**: Works even in non-Git folders by showing just the workspace name
- **Minimal Configuration**: Simple settings for enabling/disabling and customizing format
- **Multi-root Workspace Support**: Works with multi-root workspaces (uses the first folder's Git info)
- **Persistent Title Monitoring**: Prevents other extensions from overriding your custom title
- **Clean State Management**: Properly restores original title when disabled

## Installation

### From VS Code Marketplace

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "WinTitle Extended"
4. Click Install

### For Development

```bash
# Clone the repository
git clone https://github.com/amirshk/wintitle-extended.git
cd wintitle-extended

# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension
npm install -g @vscode/vsce
vsce package

# Install the packaged extension
code --install-extension wintitle-extended-*.vsix
```

## Usage

Once installed, the extension automatically activates when you open a folder. No manual configuration is required!

- The window title will update to include your current branch name
- A status bar item will appear showing the extension status
- Click the status bar item to toggle the extension on/off

### Custom Project Configuration

You can customize your window title by creating a `.vscode.name.json` file in the root of your workspace with the following structure:

```json
{
  "customName": "Your Custom Project Name",
  "titleFormat": "${rootName} [${branchName}] - ${customName}"
}
```

The file supports the following parameters:

- **customName**: A custom identifier that will be included in the window title
- **titleFormat**: A custom format string for the entire window title, which can include the following variables:
  - `${rootName}`: The name of the workspace folder
  - `${branchName}`: The name of the current Git branch
  - `${customName}`: The custom name specified above

If `titleFormat` is not specified, the extension will use the format from the settings and append the custom name in brackets.

This is especially useful for:
- Distinguishing between similar projects
- Adding environment information (dev, staging, prod)
- Including client or team names in the title
- Labeling different VSCode windows when working on multiple features simultaneously
- Creating completely custom window title formats for specific projects

#### Best Practice: Add to .gitignore

It's recommended to add `.vscode.name.json` to your `.gitignore` file. This allows each developer to set different custom names for their local workspace instances without affecting others. For example, you might have multiple VSCode windows open for the same repository, each working on a different feature, and want to label them as "Feature A", "Feature B", etc.

### Commands

The extension provides the following commands (accessible via Command Palette - Ctrl+Shift+P / Cmd+Shift+P):

- **Toggle Branch Title**: Enable or disable the extension
- **Enable Branch Title**: Turn on the extension
- **Disable Branch Title**: Turn off the extension

## Settings

- `wintitleExtended.enabled`: Enable/disable the feature (default: `true`)
- `wintitleExtended.format`: Customize the window title format (default: `${rootName} - ${branchName}`)
  - `${rootName}`: The name of the workspace folder
  - `${branchName}`: The name of the current Git branch

## Requirements

- Visual Studio Code v1.60.0 or higher
- Git (optional - extension will work without Git but will only show workspace name)

## Known Issues

- In multi-root workspaces, only the first folder's Git information is used
- The extension may take a moment to activate when VSCode starts
- The extension modifies the `window.title` parameter in your `.vscode/settings.json` or `.code-workspace` file, which may result in frequent changes to these files

## Troubleshooting

### Window title not updating

1. Ensure the extension is enabled (check status bar item)
2. Verify you're in a Git repository (check for .git folder)
3. Try running the "Enable Branch Title" command from the Command Palette
4. Restart VSCode if the issue persists

### Extension not activating

1. Check the Output panel (View > Output) and select "WinTitle Extended" from the dropdown
2. Look for any error messages in the logs
3. Ensure your workspace is a Git repository

## Development

```bash
# Clone the repository
git clone https://github.com/your-username/vscode-branch-title-extension.git
cd vscode-branch-title-extension

# Install dependencies
npm install

# Compile the extension
npm run compile

# Package the extension
npm run package
```

To debug the extension:
1. Open the project in VSCode
2. Press `F5` to launch an Extension Development Host
3. Check the Debug Console for log messages

## Contributing

Contributions are welcome! Please follow these simple steps:

1. Fork the repository
2. Make your changes
3. Create a Pull Request

Please ensure your code follows the existing style and includes appropriate documentation.

## License

This extension is licensed under the [MIT License](LICENSE).

For detailed release notes, please see the [CHANGELOG.md](CHANGELOG.md) file.
