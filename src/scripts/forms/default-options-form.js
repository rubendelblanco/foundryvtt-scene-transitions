import CONSTANTS from "../constants.js";
import { Utils } from "../utils.js";

export default class DefaultOptionsForm extends FormApplication {
  constructor(...args) {
    super(...args);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: CONSTANTS.TEMPLATE.EDIT_TRANSITION_FORM,
      title: game.i18n.localize("scene-transitions.configureDefaultOptions"),
      width: 400,
      height: 680,
      closeOnSubmit: true,
      minimizable: true,
      resizable: true,
    });
  }

  async getData() {
    const data = Utils.getSetting(CONSTANTS.SETTING.DEFAULT_OPTIONS) ?? CONSTANTS.DEFAULT_SETTING;

    return { ...data, default: CONSTANTS.DEFAULT_SETTING };
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.on("click", "[data-action]", this.handleButtonClick.bind(this));
  }

  async handleButtonClick(event) {
    event.preventDefault();
    const clickedElement = $(event.currentTarget);
    const { action } = clickedElement.data();
    switch (action) {
      case "reset": {
        await this.#reset();
        break;
      }
    }
  }

  async #reset() {
    await Utils.setSetting(CONSTANTS.SETTING.DEFAULT_OPTIONS, CONSTANTS.DEFAULT_SETTING);
    this.render(true);
  }

  async _updateObject(event, formData) {
    Utils.setSetting(CONSTANTS.SETTING.DEFAULT_OPTIONS, formData);
  }
}
