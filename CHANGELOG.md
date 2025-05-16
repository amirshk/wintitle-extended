# Change Log

All notable changes to the "WinTitle Extended" extension will be documented in this file.

## [1.2.4] - 2025-05-16

### Changed
- Improved README.md for clarity and consistency
- Added VS Code Marketplace and GitHub repository links
- Added known issue about window.title parameter changes

## [1.2.3] - 2025-05-16

### Changed
- Updated README.md to remove screenshots
- Updated installation instructions for VS Code Marketplace availability

## [1.2.2] - 2025-05-16

### Fixed
- Critical bug where the extension affected all VS Code windows instead of just the current one
- Now uses workspace-specific settings to ensure each window maintains its own title

## [1.2.1] - 2025-05-16

### Added
- Persistent title monitoring to prevent other extensions from overriding the title
- Improved handling of enabled/disabled state
- Better cleanup when extension is disabled

## [1.1.0] - 2023-05-15

### Added
- Custom title format in `.vscode.name.json` file
- Support for `titleFormat` parameter with variables: `${rootName}`, `${branchName}`, and `${customName}`
- Improved documentation with comprehensive installation instructions
- Examples for custom formatting in README

### Changed
- Renamed extension from "VSCode Branch Title Extension" to "WinTitle Extended"
- Updated publisher ID format for proper packaging
- Improved error handling for custom configuration loading

### Fixed
- Fixed packaging issues for proper VSIX generation
- Enhanced backward compatibility for existing users

## [1.0.0] - 2025-05-16

### Added
- Initial release
- Window title shows current Git branch
- Status bar integration with toggle functionality
- Enable/disable commands via Command Palette
- Configurable title format via settings
- Custom project name via `.vscode.name.json`
- Graceful handling of missing Git extension and non-Git folders
- Support for multi-root workspaces
- Proper error handling and user notifications
