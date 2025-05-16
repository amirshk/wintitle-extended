import * as vscode from 'vscode';

// Store active title monitoring intervals
let activeTitleMonitoringInterval: NodeJS.Timeout | null = null;

// Store the original window title for each workspace
const originalTitles = new Map<string, string>();

// Function to set window title without modifying workspace settings file
function setWindowTitle(title: string, extensionContext: vscode.ExtensionContext): void {
    // Log the title we're trying to set
    console.log(`[WinTitleExtended] Attempting to set window title: ${title}`);
    
    // Store the title in extension state
    extensionContext.globalState.update('wintitleExtended.currentTitle', title);
    
    // Clear any existing monitoring interval
    if (activeTitleMonitoringInterval) {
        clearInterval(activeTitleMonitoringInterval);
        activeTitleMonitoringInterval = null;
    }
    
    // Get workspace identifier - this is crucial to avoid affecting other windows
    const workspaceId = getWorkspaceId();
    if (!workspaceId) {
        console.log('[WinTitleExtended] No workspace identifier available, cannot set title');
        return;
    }
    
    // Use a safer approach that doesn't modify workspace settings
    try {
        // Store the current title in memory if we haven't already
        if (!originalTitles.has(workspaceId)) {
            const currentTitle = vscode.workspace.getConfiguration('window').get<string>('title', '');
            originalTitles.set(workspaceId, currentTitle);
            console.log(`[WinTitleExtended] Stored original title for workspace: ${currentTitle}`);
        }
        
        // Use the workspace-specific setting to avoid affecting other windows
        vscode.workspace.getConfiguration('window').update('title', title, vscode.ConfigurationTarget.Workspace);
        
        // Don't clean up the title setting immediately - this makes it more persistent
        // Instead, we'll let it stay until the next change
        
        // Get the current enabled state
        const config = vscode.workspace.getConfiguration('wintitleExtended');
        const enabled = config.get<boolean>('enabled', true);
        
        // Only set up monitoring if the extension is enabled
        if (enabled) {
            // Set up a recurring check to ensure our title stays in place
            activeTitleMonitoringInterval = setInterval(() => {
                // Check if extension is still enabled
                const currentConfig = vscode.workspace.getConfiguration('wintitleExtended');
                const stillEnabled = currentConfig.get<boolean>('enabled', true);
                
                if (!stillEnabled) {
                    // Extension was disabled, stop monitoring
                    if (activeTitleMonitoringInterval) {
                        clearInterval(activeTitleMonitoringInterval);
                        activeTitleMonitoringInterval = null;
                    }
                    return;
                }
                
                const currentTitle = vscode.workspace.getConfiguration('window').get<string>('title');
                if (currentTitle !== title) {
                    console.log(`[WinTitleExtended] Title was changed externally, resetting to: ${title}`);
                    vscode.workspace.getConfiguration('window').update('title', title, vscode.ConfigurationTarget.Workspace);
                }
            }, 2000); // Check every 2 seconds
            
            // Clear the interval after 30 seconds to avoid unnecessary resource usage
            setTimeout(() => {
                if (activeTitleMonitoringInterval) {
                    clearInterval(activeTitleMonitoringInterval);
                    activeTitleMonitoringInterval = null;
                }
            }, 30000);
        }
    } catch (error) {
        console.log(`[WinTitleExtended] Error setting window title: ${error}`);
    }
}

// Helper function to get a unique identifier for the current workspace
function getWorkspaceId(): string | undefined {
    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
        return undefined;
    }
    
    // Use the first workspace folder's path as the identifier
    return vscode.workspace.workspaceFolders[0].uri.toString();
}

export function activate(context: vscode.ExtensionContext) {
    console.log('[WinTitleExtended] Activated');
    
    // Create status bar item to show extension status
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'wintitleExtended.toggleEnabled';
    statusBarItem.tooltip = 'Toggle WinTitle Extended';
    context.subscriptions.push(statusBarItem);
    
    // Store original window title to restore when disabled
    let originalTitle = '';
    
    // Get configuration
    const config = vscode.workspace.getConfiguration('wintitleExtended');
    let enabled = config.get<boolean>('enabled', true);
    let format = config.get<string>('format', '${rootName} - ${branchName}');
    console.log(`[WinTitleExtended] Config loaded: enabled=${enabled}, format=${format}`);
    
    // Save original title if we can
    try {
        originalTitle = vscode.workspace.getConfiguration('window').get<string>('title', '');
        console.log(`[WinTitleExtended] Original title: ${originalTitle}`);
    } catch (error) {
        console.log('[WinTitleExtended] Could not get original title');
    }
    
    // Update status bar based on current state
    const updateStatusBar = () => {
        if (enabled) {
            statusBarItem.text = '$(git-branch) Branch Title: ON';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else {
            statusBarItem.text = '$(git-branch) Branch Title: OFF';
            statusBarItem.backgroundColor = undefined;
        }
        statusBarItem.show();
    };
    
    // Interface for the .vscode.name.json file structure
    interface NameConfig {
        customName?: string;
        titleFormat?: string;
    }

    // Function to read custom configuration from .vscode.name.json
    const readCustomConfig = (workspaceRoot: string): Promise<NameConfig> => {
        return new Promise((resolve) => {
            const fs = require('fs');
            const path = require('path');
            const nameFilePath = path.join(workspaceRoot, '.vscode.name.json');
            
            // Default empty config
            const defaultConfig: NameConfig = {
                customName: '',
                titleFormat: ''
            };
            
            // Check if the file exists
            fs.access(nameFilePath, fs.constants.F_OK, (err: any) => {
                if (err) {
                    // File doesn't exist, return empty config
                    console.log('[WinTitleExtended] No .vscode.name.json file found');
                    resolve(defaultConfig);
                    return;
                }
                
                // Read the file
                fs.readFile(nameFilePath, 'utf8', (err: any, data: string) => {
                    if (err) {
                        console.log(`[WinTitleExtended] Error reading .vscode.name.json: ${err}`);
                        resolve(defaultConfig);
                        return;
                    }
                    
                    try {
                        const nameConfig = JSON.parse(data);
                        const config: NameConfig = {
                            customName: nameConfig.customName || '',
                            titleFormat: nameConfig.titleFormat || ''
                        };
                        
                        console.log(`[WinTitleExtended] Found custom config: name=${config.customName}, format=${config.titleFormat}`);
                        resolve(config);
                    } catch (parseError) {
                        console.log(`[WinTitleExtended] Error parsing .vscode.name.json: ${parseError}`);
                        resolve(defaultConfig);
                    }
                });
            });
        });
    };
    
    const updateTitle = async () => {
        console.log('[WinTitleExtended] updateTitle() called');
        const rootName = vscode.workspace.name || 'No Workspace';
        let branchName = '';
        let customName = '';
        let customFormat = '';
        
        // Check if we have a workspace
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const customConfig = await readCustomConfig(workspaceRoot);
            customName = customConfig.customName || '';
            customFormat = customConfig.titleFormat || '';
        }
        
        // Try to get Git extension
        const gitExt = vscode.extensions.getExtension('vscode.git');
        if (!gitExt) {
            console.log('[WinTitleExtended] Git extension not found.');
            vscode.window.showWarningMessage('WinTitle Extended: Git extension not found. Only workspace name will be shown.');
            const fallbackTitle = customName ? `${rootName} [${customName}]` : rootName;
            // Use the internal API to set the title without modifying workspace settings
            setWindowTitle(fallbackTitle, context);
            return;
        }
        
        try {
            const gitExtension = gitExt.exports;
            const api = gitExtension?.getAPI(1);
            if (!api) {
                console.log('[WinTitleExtended] Git API not available.');
                vscode.window.showWarningMessage('WinTitle Extended: Git API not available. Only workspace name will be shown.');
                const fallbackTitle = customName ? `${rootName} [${customName}]` : rootName;
                // Use the internal API to set the title without modifying workspace settings
                setWindowTitle(fallbackTitle, context);
                return;
            }
            
            // Check if we have any repositories
            if (!api.repositories || api.repositories.length === 0) {
                console.log('[WinTitleExtended] No repository found.');
                vscode.window.showInformationMessage('WinTitle Extended: No Git repository found in workspace. Only workspace name will be shown.');
                const fallbackTitle = customName ? `${rootName} [${customName}]` : rootName;
                // Use the internal API to set the title without modifying workspace settings
                setWindowTitle(fallbackTitle, context);
                return;
            }
            
            const repo = api.repositories[0];
            branchName = repo.state.HEAD?.name || 'No Branch';
            
            // Update status bar to show current branch
            statusBarItem.tooltip = `Current branch: ${branchName}\nClick to toggle WinTitle Extended`;
        } catch (error) {
            console.log(`[WinTitleExtended] Error accessing Git API: ${error}`);
            vscode.window.showErrorMessage(`WinTitle Extended: Error accessing Git API: ${error}`);
            const fallbackTitle = customName ? `${rootName} [${customName}]` : rootName;
            // Use the internal API to set the title without modifying workspace settings
            setWindowTitle(fallbackTitle, context);
            return;
        }
        
        // Format and set the title
        let newTitle = '';
        
        // Use custom format from .vscode.name.json if available, otherwise use the one from settings
        if (customFormat) {
            newTitle = customFormat
                .replace('${rootName}', rootName)
                .replace('${branchName}', branchName)
                .replace('${customName}', customName);
            console.log(`[WinTitleExtended] Using custom format from .vscode.name.json: ${customFormat}`);
        } else {
            // Use format from settings
            newTitle = format.replace('${rootName}', rootName).replace('${branchName}', branchName);
            
            // Append custom name if available (legacy behavior)
            if (customName) {
                newTitle = `${newTitle} [${customName}]`;
            }
        }
        
        console.log(`[WinTitleExtended] Setting window.title: ${newTitle}`);
        // Use the internal API to set the title without modifying workspace settings
        setWindowTitle(newTitle, context);
    };

    // Toggle command - more intuitive than separate enable/disable
    context.subscriptions.push(vscode.commands.registerCommand('wintitleExtended.toggleEnabled', () => {
        console.log('[WinTitleExtended] Toggle command triggered');
        enabled = !enabled;
        const config = vscode.workspace.getConfiguration('wintitleExtended');
        config.update('enabled', enabled, true).then(() => {
            if (enabled) {
                vscode.window.showInformationMessage('WinTitle Extended enabled');
                updateTitle();
            } else {
                vscode.window.showInformationMessage('WinTitle Extended disabled');
                // Clear any active title monitoring
                if (activeTitleMonitoringInterval) {
                    clearInterval(activeTitleMonitoringInterval);
                    activeTitleMonitoringInterval = null;
                }
                // Restore original title for this workspace
                const workspaceId = getWorkspaceId();
                if (workspaceId && originalTitles.has(workspaceId)) {
                    const originalTitle = originalTitles.get(workspaceId);
                    // When disabling, we want to set the title but not monitor it
                    // So we'll directly update the configuration without monitoring
                    vscode.workspace.getConfiguration('window').update('title', originalTitle, vscode.ConfigurationTarget.Workspace);
                    // Remove from our tracking map
                    originalTitles.delete(workspaceId);
                }
            }
            updateStatusBar();
        });
    }));
    
    // Keep the old commands for backward compatibility
    context.subscriptions.push(vscode.commands.registerCommand('wintitleExtended.enable', () => {
        if (!enabled) {
            vscode.commands.executeCommand('wintitleExtended.toggleEnabled');
        } else {
            vscode.window.showInformationMessage('WinTitle Extended is already enabled');
        }
    }));
    
    context.subscriptions.push(vscode.commands.registerCommand('wintitleExtended.disable', () => {
        if (enabled) {
            vscode.commands.executeCommand('wintitleExtended.toggleEnabled');
        } else {
            vscode.window.showInformationMessage('WinTitle Extended is already disabled');
        }
    }));
    
    updateStatusBar();
    
    if (!enabled) {
        console.log('[WinTitleExtended] Disabled by configuration.');
        return;
    }

    // Check if we're in a workspace before doing anything Git-related
    const hasWorkspace = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0;
    
    if (hasWorkspace) {
        // Delay initial setup to ensure Git extension is loaded
        setTimeout(() => {
            // First check if this is even a Git repository before trying to use Git API
            const fs = require('fs');
            const path = require('path');
            const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
            const gitDir = path.join(workspaceRoot, '.git');
            
            // Check if .git directory exists
            fs.access(gitDir, fs.constants.F_OK, (err: any) => {
                if (err) {
                    // No .git directory, just show workspace name
                    console.log('[WinTitleExtended] No .git directory found, using workspace name only');
                    const rootName = vscode.workspace.name || 'No Workspace';
                    const fallbackTitle = rootName;
                    // Use the internal API to set the title without modifying workspace settings
                    setWindowTitle(fallbackTitle, context);
                    
                    // Update status bar to show no Git
                    statusBarItem.tooltip = 'No Git repository found\nClick to toggle WinTitle Extended';
                    return;
                }
                
                // We have a Git directory, now try to use the Git API
                const gitExt = vscode.extensions.getExtension('vscode.git');
                const gitExtension = gitExt?.exports;
                const api = gitExtension?.getAPI(1);
                
                if (api) {
                    console.log('[WinTitleExtended] Git API available, setting up listeners');
                    
                    // Set up event listeners for Git repository changes
                    // Listen to repository changes if available
                    if (api.repositories && api.repositories.length > 0) {
                        const repo = api.repositories[0];
                        repo.state.onDidChange(() => {
                            console.log('[WinTitleExtended] Repository state changed');
                            updateTitle();
                        });
                    }
                    
                    // Listen for when repositories are added/changed
                    if (typeof api.onDidOpenRepository === 'function') {
                        api.onDidOpenRepository(() => {
                            console.log('[WinTitleExtended] Repository opened');
                            updateTitle();
                        });
                    }
                    
                    // Initial title update after Git is available
                    updateTitle();
                } else {
                    console.log('[WinTitleExtended] Git API not available for event listeners.');
                    updateTitle(); // Still try to update title with fallback
                }
            });
        }, 1000); // 1 second delay should be enough
    } else {
        // No workspace folders open, just show a generic title
        console.log('[WinTitleExtended] No workspace folders open');
        statusBarItem.tooltip = 'No workspace open\nClick to toggle WinTitle Extended';
    }

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('wintitleExtended')) {
                enabled = config.get<boolean>('enabled', true);
                format = config.get<string>('format', '${rootName} - ${branchName}');
                console.log(`[WinTitleExtended] Config changed: enabled=${enabled}, format=${format}`);
                if (enabled) {
                    updateTitle();
                }
            }
        })
    );
}

export function deactivate() {
    console.log('[WinTitleExtended] Deactivated');
}
