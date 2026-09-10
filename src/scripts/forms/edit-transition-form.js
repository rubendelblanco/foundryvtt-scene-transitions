import CONSTANTS from "../constants.js";
import Logger from "../logger.js";
import { Utils } from "../utils.js";
import DefaultOptionsForm from "./default-options-form.js";

/**
 * Form controller for editing transitions
 */
export default class EditTransitionForm extends DefaultOptionsForm {
  constructor(object, options) {
    super(object, options);
    this.transition = object || {};
    this.data = {};
    this.interval = null;
  }

  /**
   *
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "scene-transitions-form",
      title: game.i18n.localize("scene-transitions.editSceneTransition"),
      template: CONSTANTS.TEMPLATE.EDIT_TRANSITION_FORM,
      classes: ["sheet", "scene-transitions-form"],
      width: 400,
      height: 680,
      left: "100px",
      closeOnSubmit: true,
      minimizable: true,
      resizable: true,
    });
  }

  /**
   * Get data for the triggler form
   */
  async getData(options) {
    const context = this.transition.options;
    context.default = CONSTANTS.DEFAULT_SETTING;
    context.isEdit = true;
    context.transitionContent = await TextEditor.enrichHTML(this.transition.options.content, {
      secrets: true,
      async: true,
    });

    return context;
  }

  /** @inheritdoc */
  async activateEditor(name, options = {}, initialContent = "") {
    // options.relativeLinks = true;
    options.plugins = {
      menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
        compact: true,
        destroyOnSave: false,
        onSave: () => {
          this._saveEditor(name, { remove: false });
        },
      }),
    };
    return super.activateEditor(name, options, initialContent);
  }

  /**
   * Handle saving the content of a specific editor by name
   * @param {string} name           The named editor to save
   * @param {boolean} [remove]      Remove the editor after saving its content
   * @returns {Promise<void>}
   */
  async _saveEditor(name, { remove = true } = {}) {
    const editor = this.editors[name];
    if (!editor || !editor.instance) throw new Error(`${name} is not an active editor name!`);
    editor.active = false;
    const { instance } = editor;
    await this._onSubmit(new Event("submit"), {
      preventClose: true,
    });

    // Remove the editor
    if (remove) {
      instance.destroy();
      editor.instance = editor.mce = null;
      if (editor.hasButton) editor.button.style.display = "block";
      this.render();
    }
    editor.changed = false;
  }

  async activateListeners(html) {
    super.activateListeners(html);

    const contentHTML = await TextEditor.enrichHTML(this.transition.options.content, {
      secrets: true,
      async: true,
    });
    $('[data-edit="content"]').html(contentHTML);

    const fontColorSelector = `${foundry.utils.isNewerVersion(game.version, 11.315) ? "color-picker" : "input"}[name="fontColor"]`;
    const fontColorElement = html[0].querySelector(fontColorSelector);
    fontColorElement.addEventListener("change", this.#updateFontColor.bind(this));

    const fontSizeElement = html[0].querySelector('input[name="fontSize"]');
    fontSizeElement.addEventListener("change", this.#updateFontSize.bind(this));

    // Figure out how to listen to all editor events
    const editorElement = html[0].querySelector(".editor-content");
    editorElement.addEventListener("input", this.#updateContent.bind(this));
    editorElement.addEventListener("cut", this.#updateContent.bind(this));
    editorElement.addEventListener("paste", this.#updateContent.bind(this));

    const bgImageElement = html[0].querySelector('input[name="bgImg"]');
    bgImageElement.addEventListener("change", this.#updateBgImage.bind(this));

    const bgPosElement = html[0].querySelector('input[name="bgPos"]');
    bgPosElement.addEventListener("change", this.#updateBgPos.bind(this));

    const bgSizeElement = html[0].querySelector('input[name="bgSize"]');
    bgSizeElement.addEventListener("change", this.#updateBgSize.bind(this));

    const bgColorSelector = `${foundry.utils.isNewerVersion(game.version, 11.315) ? "color-picker" : "input"}[name="bgColor"]`;
    const bgColorElement = html[0].querySelector(bgColorSelector);
    bgColorElement.addEventListener("change", this.#updateBgColor.bind(this));

    const bgOpacityElement = html[0].querySelector('input[name="bgOpacity"]');
    bgOpacityElement.addEventListener("change", this.#updateBgOpacity.bind(this));

    const audioElement = html[0].querySelector('input[name="audio"]');
    audioElement.addEventListener("change", this.#updateAudio.bind(this));

    const volumeElement = html[0].querySelector('input[name="volume"]');
    volumeElement.addEventListener("change", this.#updateVolume.bind(this));
  }

  #updateFontColor(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-content").style.color = event.target.value;
  }

  #updateFontSize(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-content").style.fontSize = `${event.target.value}px`;
  }

  #updateContent(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-content").innerHTML =
      this.editors.content.options.target.innerHTML;
  }

  #updateBgImage(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-bg").style.backgroundImage =
      `url('${event.target.value}')`;
  }

  #updateBgPos(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-bg").style.backgroundPosition = event.target.value;
  }

  #updateBgSize(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-bg").style.backgroundSize = event.target.value;
  }

  #updateBgColor(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-bg").style.backgroundColor = event.target.value;
  }

  #updateBgOpacity(event) {
    if (!this.transition.element) {
      return;
    }
    this.transition.element.querySelector(".scene-transitions-bg").style.opacity = event.target.value;
  }

  #updateAudio(event) {
    this.transition.playAudio(event.target.value);
  }

  #updateVolume(event) {
    if (this.transition.audio?.playing) {
      this.transition.audio.gain.value = event.target.value;
    }
  }

  // @ts-ignore
  close() {
    this.transition.destroy(true);
    super.close({ force: true });
  }

  async _updateObject(event, formData) {
    this.transition.updateData(formData);

    const scene = game.scenes?.get(this.transition.options.sceneID);

    if (this.transition.options.sceneID && scene) {
      // Persist only the plain options data, not the live SceneTransition instance -
      // this.transition carries a real DOM element reference (this.element, set once
      // render() has run) which can't be safely stored as flag data, and was silently
      // resulting in an empty {} being saved instead of an error. Spreading into a
      // fresh {} guarantees a plain object regardless of SceneTransitionOptions' own
      // prototype (foundry.utils.deepClone can return class instances unchanged).
      await scene.setFlag(CONSTANTS.MODULE.ID, "transition", {
        options: { ...this.transition.options },
      });
    } else {
      Logger.warn(`No scene has been found with id ${this.transition.options.sceneID}`);
      return;
    }
  }
}
