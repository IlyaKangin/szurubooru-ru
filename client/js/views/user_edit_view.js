'use strict';

const config = require('../config.js');
const events = require('../events.js');
const views = require('../util/views.js');
const FileDropperControl = require('../controls/file_dropper_control.js');

const template = views.getTemplate('user-edit');

class UserEditView extends events.EventTarget {
    constructor(ctx) {
        super();

        ctx.userNamePattern = config.userNameRegex + /|^$/.source;
        ctx.passwordPattern = config.passwordRegex + /|^$/.source;

        this._user = ctx.user;
        this._hostNode = ctx.hostNode;
        views.replaceContent(this._hostNode, template(ctx));
        views.decorateValidator(this._formNode);

        this._avatarContent = null;
        if (this._avatarContentInputNode) {
            new FileDropperControl(
                this._avatarContentInputNode,
                {
                    lock: true,
                    resolve: files => {
                        this._hostNode.querySelector(
                            '[name=avatar-style][value=manual]').checked = true;
                        this._avatarContent = files[0];
                    },
                });
        }

        this._formNode.addEventListener('submit', e => this._evtSubmit(e));
    }

    clearMessages() {
        views.clearMessages(this._hostNode);
    }

    showSuccess(message) {
        views.showSuccess(this._hostNode, message);
    }

    showError(message) {
        views.showError(this._hostNode, message);
    }

    enableForm() {
        views.enableForm(this._formNode);
    }

    disableForm() {
        views.disableForm(this._formNode);
    }

    _evtSubmit(e) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('submit', {
            detail: {
                user: this._user,

                name: this._userNameInputNode ?
                    this._userNameInputNode.value :
                    undefined,

                email: this._emailInputNode ?
                    this._emailInputNode.value :
                    undefined,

                rank: this._rankInputNode ?
                    this._rankInputNode.value :
                    undefined,

                avatarStyle: this._avatarStyleInputNode ?
                    this._avatarStyleInputNode.value :
                    undefined,

                password: this._passwordInputNode ?
                    this._passwordInputNode.value :
                    undefined,

                avatarContent: this._avatarContent,
            },
        }));
    }

    get _formNode() {
        return this._hostNode.querySelector('form');
    }

    get _rankInputNode() {
        return this._formNode.querySelector('[name=rank]');
    }

    get _emailInputNode() {
        return this._formNode.querySelector('[name=email]');
    }

    get _userNameInputNode() {
        return this._formNode.querySelector('[name=name]');
    }

    get _passwordInputNode() {
        return this._formNode.querySelector('[name=password]');
    }

    get _avatarContentInputNode() {
        return this._formNode.querySelector('#avatar-content');
    }

    get _avatarStyleInputNode() {
        return this._formNode.querySelector('[name=avatar-style]:checked');
    }
}

module.exports = UserEditView;
