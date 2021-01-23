import * as prettier from "prettier";
import { Uri } from "vscode";

const Handlebars = {
  name: "Handlebars",
  type: "markup",
  color: "#f7931e",
  aliases: ["hbs", "htmlbars"],
  extensions: [".handlebars", ".hbs"],
  tmScope: "text.html.handlebars",
  aceMode: "handlebars",
  languageId: 155,
};

export class LanguageResolver {
  public async getParserFromLanguageId(
    uri: Uri,
    languageId: string
  ): Promise<prettier.BuiltInParserName | string | undefined> {
    // This is a workaround for when the vscodeLanguageId is duplicated in multiple
    // prettier languages. In these cases the first match is not the preferred match
    // so we override with the parser that exactly matches the languageId.
    // Specific undesired cases here are:
    //  `html` matching to `angular`
    //  `json` matching to `json-stringify`
    const languageParsers = ["html", "json"];
    if (uri.scheme === "untitled" && languageParsers.includes(languageId)) {
      return languageId;
    }
    const language = (await this.getSupportLanguages()).find(
      (lang) =>
        lang &&
        lang.extensions &&
        Array.isArray(lang.vscodeLanguageIds) &&
        lang.vscodeLanguageIds.includes(languageId)
    );
    if (language && language.parsers?.length > 0) {
      return language.parsers[0];
    }
  }

  public async getSupportedLanguages(): Promise<string[]> {
    const enabledLanguages: string[] = [];
    (await this.getSupportLanguages()).forEach((lang) => {
      if (lang && lang.vscodeLanguageIds) {
        enabledLanguages.push(...lang.vscodeLanguageIds);
      }
    });
    return enabledLanguages.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  public getRangeSupportedLanguages(): string[] {
    return [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
      "json",
      "graphql",
    ];
  }

  public async getSupportedFileExtensions() {
    const extensions: string[] = [];
    (await this.getSupportLanguages()).forEach((lang) => {
      if (lang && lang.extensions) {
        extensions.push(...lang.extensions);
      }
    });
    return extensions.filter((value, index, self) => {
      return self.indexOf(value) === index;
    });
  }

  private async getSupportLanguages() {
    const hLang = this.createLanguage(Handlebars, () => ({
      since: null,
      parsers: ["glimmer"],
      vscodeLanguageIds: ["handlebars"],
    }));

    return [hLang];
  }

  // Copied from https://github.com/prettier/prettier/blob/master/src/utils/create-language.js
  private createLanguage(
    linguistData: { [x: string]: any; languageId: any },
    override: {
      (): { since: null; parsers: string[]; vscodeLanguageIds: string[] };
      (arg0: any): any;
    }
  ): prettier.SupportLanguage {
    const { languageId, ...rest } = linguistData;
    return {
      linguistLanguageId: languageId,
      ...rest,
      ...override(linguistData),
    };
  }
}
