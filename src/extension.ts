import { commands, ExtensionContext, workspace } from "vscode";
import { createConfigFile } from "./commands";
import { ConfigResolver } from "./ConfigResolver";
import { IgnorerResolver } from "./IgnorerResolver";
import { LanguageResolver } from "./LanguageResolver";
import { LoggingService } from "./LoggingService";
import { ModuleResolver } from "./ModuleResolver";
import { NotificationService } from "./NotificationService";
import PrettierEditService from "./PrettierEditService";
import { StatusBarService } from "./StatusBarService";
import { TemplateService } from "./TemplateService";
import { getConfig } from "./util";
import { RESTART_TO_ENABLE } from "./message";

// the application insights key (also known as instrumentation key)
const extensionName = process.env.EXTENSION_NAME || "dev.prettier-vscode";
const extensionVersion = process.env.EXTENSION_VERSION || "0.0.0";

export function activate(context: ExtensionContext) {
  const loggingService = new LoggingService();

  loggingService.logInfo(`Extension Name: ${extensionName}.`);
  loggingService.logInfo(`Extension Version: ${extensionVersion}.`);

  const { enable } = getConfig();
  if (!enable) {
    loggingService.logInfo(
      "Extension is disabled. No formatters will be registered. To enable, change the `prettier.enable` to `true` and restart VS Code."
    );
    context.subscriptions.push(
      workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("prettier.enable")) {
          loggingService.logWarning(RESTART_TO_ENABLE);
        }
      })
    );
    return;
  }

  const templateService = new TemplateService(loggingService);
  const createConfigFileFunc = createConfigFile(templateService);
  const createConfigFileCommand = commands.registerCommand(
    "prettier.createConfigFile",
    createConfigFileFunc
  );
  const openOutputCommand = commands.registerCommand(
    "prettier.openOutput",
    () => {
      loggingService.show();
    }
  );

  const ignoreResolver = new IgnorerResolver(loggingService);
  const configResolver = new ConfigResolver(loggingService);
  const notificationService = new NotificationService(loggingService);

  const moduleResolver = new ModuleResolver(
    loggingService,
    notificationService
  );

  const languageResolver = new LanguageResolver();

  const statusBarService = new StatusBarService(
    languageResolver,
    loggingService
  );

  const editService = new PrettierEditService(
    moduleResolver,
    languageResolver,
    ignoreResolver,
    configResolver,
    loggingService,
    notificationService,
    statusBarService
  );
  editService.registerFormatter();

  context.subscriptions.push(
    editService,
    createConfigFileCommand,
    openOutputCommand,
    ...editService.registerDisposables(),
    ...statusBarService.registerDisposables()
  );
}
