import { Injectable } from '@angular/core';
import { NavController, Config } from '@ionic/angular';
import { Animation } from '@ionic/core';

@Injectable()
export class Navigator {

  private params;
  private animation: 'default' | 'push' | 'modal' | 'fade' | 'safepush' = 'default';
  private animationConfigReady = false;
  private startNavFlow = false;
  private defaultAnimation: 'default' | 'push' | 'modal' | 'fade' | 'safepush' = 'default';

  constructor(
    private navCtrl: NavController,
    private config: Config
  ) {}

  getParams() {
    return this.params;
  }

  push(
    url: string,
    params?: {},
    animation: 'default' | 'push' | 'modal' | 'fade' | 'safepush' = 'default',
    startNavFlow = false
  ) {
    if (!this.animationConfigReady) { this.setAnimationConfig(); }
    this.params = params;
    this.animation = animation;
    this.startNavFlow = startNavFlow;
    return this.navCtrl.navigateForward(url);
  }

  pop(url?: string, params?: {}) {
    this.params = params;
    const targetUrl = url || this.getPreviousPageUrl();
    if (!targetUrl) {
      return Promise.resolve(false);
    }
    return this.navCtrl.navigateBack(targetUrl);
  }

  popToRoot() {
    return this.navCtrl.navigateBack(this.getRootPageUrl());
  }

  setRoot(url: string, params?: {}) {
    this.params = params;
    return this.navCtrl.navigateRoot(url);
  }

  closeCurrentNavFlow(params?: {}) {
    const views = [...this.getViews()].reverse();
    const currentNavFlow = views.findIndex(v => v.element.getAttribute('new-nav-flow'));
    const targetPage = currentNavFlow >= 0 && views.length > 1 ? views[currentNavFlow + 1] : null;
    return targetPage ? this.pop(targetPage.url, params) : this.popToRoot();
  }

  getViews() {
    const c: any = { ...this.navCtrl };
    let views = [];
    if (c && c.topOutlet && c.topOutlet.stackCtrl) { views = c.topOutlet.stackCtrl.views; }
    return views;
  }

  setDefaultAnimation(animation: 'default' | 'push' | 'modal' | 'fade' | 'safepush') {
    this.defaultAnimation = animation;
  }

  private getPreviousPageUrl() {
    const views = this.getViews();
    return (views && views.length > 1) ? views[views.length - 2].url : null;
  }

  private getRootPageUrl() {
    const views = this.getViews();
    return (views && views.length) ? views[0].url : '';
  }

  private setAnimationConfig() {
    this.animationConfigReady = true;
    this.config.set('navAnimation',
      (AnimationC: Animation, baseEl: HTMLElement, opts: any): Promise<Animation> => {
        let anim = this.animation;
        if (opts.direction === 'back') {
          anim = opts.enteringEl.getAttribute('animation-leave');
        } else if (opts.direction === 'forward' && this.startNavFlow) {
          opts.enteringEl.setAttribute('new-nav-flow', true);
          this.startNavFlow = false;
        }
        opts.enteringEl.setAttribute('animation-enter', this.animation);
        opts.leavingEl.setAttribute('animation-leave', this.animation);
        const ios = (opts && opts.mode === 'ios');
        if (anim === 'default') { anim = this.defaultAnimation; }
        switch (anim) {
          case 'default':
            return ios ?           this.getAnimation('push', AnimationC, baseEl, opts)
                       :           this.getAnimation('modal', AnimationC, baseEl, opts);
          case 'push':      return this.getAnimation('push', AnimationC, baseEl, opts);
          case 'modal':     return this.getAnimation('modal', AnimationC, baseEl, opts);
          case 'fade':      return this.getAnimation('fade', AnimationC, baseEl, opts);
          case 'safepush':  return this.getAnimation('safepush', AnimationC, baseEl, opts);
          default:          return this.getAnimation('modal', AnimationC, baseEl, opts);
        }
      }
    );
  }

  private getAnimation(type: 'push' | 'modal' | 'fade' | 'safepush', a, b, o) {
    switch (type) {
      case 'push':     return iosTransitionAnimation(a, b, o);
      case 'modal':    return mdTransitionAnimation(a, b, o);
      case 'fade':     return fadeAnimation(a, b, o);
      case 'safepush': return safePushAnimation(a, b, o);
    }
  }

}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *
 *
 *
 *        A N I M A T I O N S
 *
 *
 *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

function iosTransitionAnimation(AnimationC, navEl, opts) {
  const shadow = function(el) { return el.shadowRoot || el; };
  const isRTL = navEl.ownerDocument.dir === 'rtl';
  const OFF_RIGHT = isRTL ? '-99.5%' : '99.5%';
  const OFF_LEFT = isRTL ? '33%' : '-33%';
  const enteringEl = opts.enteringEl;
  const leavingEl = opts.leavingEl;
  const rootTransition = new AnimationC();
  const easing = opts.easing || 'cubic-bezier(0.36,0.66,0.04,1)';
  rootTransition.addElement(enteringEl).duration(opts.duration || 500).easing(easing).beforeRemoveClass('ion-page-invisible');
  if (leavingEl && navEl) {
    const navDecor = new AnimationC();
    navDecor.addElement(navEl);
    rootTransition.add(navDecor);
  }
  const backDirection = (opts.direction === 'back');
  const contentEl = enteringEl.querySelector(':scope > ion-content');
  const headerEls = enteringEl.querySelectorAll(':scope > ion-header > *:not(ion-toolbar), :scope > ion-footer > *');
  const enteringToolBarEls = enteringEl.querySelectorAll(':scope > ion-header > ion-toolbar');
  const enteringContent = new AnimationC();
  if (!contentEl && enteringToolBarEls.length === 0 && headerEls.length === 0) {
    enteringContent.addElement(enteringEl.querySelector(':scope > .ion-page, :scope > ion-nav, :scope > ion-tabs'));
  } else {
    enteringContent.addElement(contentEl);
    enteringContent.addElement(headerEls);
  }
  rootTransition.add(enteringContent);
  if (backDirection) {
    enteringContent.beforeClearStyles(['opacity']).fromTo('translateX', OFF_LEFT, '0%', true).fromTo('opacity', 0.8, 1, true);
  } else {
    enteringContent.beforeClearStyles(['opacity']).fromTo('translateX', OFF_RIGHT, '0%', true);
  }
  enteringToolBarEls.forEach(enteringToolBarEl => {
    const enteringToolBar = new AnimationC();
    enteringToolBar.addElement(enteringToolBarEl);
    rootTransition.add(enteringToolBar);
    const enteringTitle = new AnimationC();
    enteringTitle.addElement(enteringToolBarEl.querySelector('ion-title'));
    const enteringToolBarButtons = new AnimationC();
    enteringToolBarButtons.addElement(enteringToolBarEl.querySelectorAll('ion-buttons,[menuToggle]'));
    const enteringToolBarItems = new AnimationC();
    enteringToolBarItems.addElement(enteringToolBarEl.querySelectorAll(':scope > *:not(ion-title):not(ion-buttons):not([menuToggle])'));
    const enteringToolBarBg = new AnimationC();
    enteringToolBarBg.addElement(shadow(enteringToolBarEl).querySelector('.toolbar-background'));
    const enteringBackButton = new AnimationC();
    const backButtonEl = enteringToolBarEl.querySelector('ion-back-button');
    if (backButtonEl) {
      enteringBackButton.addElement(backButtonEl);
    }
    enteringToolBar
      .add(enteringTitle)
      .add(enteringToolBarButtons)
      .add(enteringToolBarItems)
      .add(enteringToolBarBg)
      .add(enteringBackButton);
    enteringTitle.fromTo('opacity', 0.01, 1, true);
    enteringToolBarButtons.fromTo('opacity', 0.01, 1, true);
    enteringToolBarItems.fromTo('opacity', 0.01, 1, true);
    if (backDirection) {
      enteringTitle.fromTo('translateX', OFF_LEFT, '0%', true);
      enteringToolBarItems.fromTo('translateX', OFF_LEFT, '0%', true);
      enteringBackButton.fromTo('opacity', 0.01, 1, true);
    } else {
      enteringTitle.fromTo('translateX', OFF_RIGHT, '0%', true);
      enteringToolBarItems.fromTo('translateX', OFF_RIGHT, '0%', true);
      enteringToolBarBg
        .beforeClearStyles(['opacity'])
        .fromTo('opacity', 0.01, 1, true);
      enteringBackButton.fromTo('opacity', 0.01, 1, true);
      if (backButtonEl) {
        const enteringBackBtnText = new AnimationC();
        enteringBackBtnText
          .addElement(shadow(backButtonEl).querySelector('.button-text'))
          .fromTo('translateX', (isRTL ? '-100px' : '100px'), '0px');
        enteringToolBar.add(enteringBackBtnText);
      }
    }
  });
  if (leavingEl) {
    const leavingContent = new AnimationC();
    leavingContent.addElement(leavingEl.querySelector(':scope > ion-content'));
    leavingContent.addElement(leavingEl.querySelectorAll(':scope > ion-header > *:not(ion-toolbar), :scope > ion-footer > *'));
    rootTransition.add(leavingContent);
    if (backDirection) {
      leavingContent.beforeClearStyles(['opacity']).fromTo('translateX', '0%', (isRTL ? '-100%' : '100%'));
    } else {
      leavingContent.fromTo('translateX', '0%', OFF_LEFT, true).fromTo('opacity', 1, 0.8, true);
    }
    const leavingToolBarEls = leavingEl.querySelectorAll(':scope > ion-header > ion-toolbar');
    leavingToolBarEls.forEach(leavingToolBarEl => {
      const leavingToolBar = new AnimationC();
      leavingToolBar.addElement(leavingToolBarEl);
      const leavingTitle = new AnimationC();
      leavingTitle.addElement(leavingToolBarEl.querySelector('ion-title'));
      const leavingToolBarButtons = new AnimationC();
      leavingToolBarButtons.addElement(leavingToolBarEl.querySelectorAll('ion-buttons,[menuToggle]'));
      const leavingToolBarItems = new AnimationC();
      const leavingToolBarItemEls = leavingToolBarEl.querySelectorAll(':scope > *:not(ion-title):not(ion-buttons):not([menuToggle])');
      if (leavingToolBarItemEls.length > 0) {
        leavingToolBarItems.addElement(leavingToolBarItemEls);
      }
      const leavingToolBarBg = new AnimationC();
      leavingToolBarBg.addElement(shadow(leavingToolBarEl).querySelector('.toolbar-background'));
      const leavingBackButton = new AnimationC();
      const backButtonEl = leavingToolBarEl.querySelector('ion-back-button');
      if (backButtonEl) {
        leavingBackButton.addElement(backButtonEl);
      }
      leavingToolBar
        .add(leavingTitle)
        .add(leavingToolBarButtons)
        .add(leavingToolBarItems)
        .add(leavingBackButton)
        .add(leavingToolBarBg);
      rootTransition.add(leavingToolBar);
      leavingBackButton.fromTo('opacity', 0.99, 0);
      leavingTitle.fromTo('opacity', 0.99, 0);
      leavingToolBarButtons.fromTo('opacity', 0.99, 0, 0);
      leavingToolBarItems.fromTo('opacity', 0.99, 0);
      if (backDirection) {
        leavingTitle.fromTo('translateX', '0%', (isRTL ? '-100%' : '100%'));
        leavingToolBarItems.fromTo('translateX', '0%', (isRTL ? '-100%' : '100%'));
        leavingToolBarBg.beforeClearStyles(['opacity']).fromTo('opacity', 1, 0.01);
        if (backButtonEl) {
          const leavingBackBtnText = new AnimationC();
          leavingBackBtnText.addElement(shadow(backButtonEl).querySelector('.button-text'));
          leavingBackBtnText.fromTo('translateX', '0%', (isRTL ? -124 : 124) + 'px');
          leavingToolBar.add(leavingBackBtnText);
        }
      } else {
        leavingTitle.fromTo('translateX', '0%', OFF_LEFT).afterClearStyles(['transform']);
        leavingToolBarItems.fromTo('translateX', '0%', OFF_LEFT).afterClearStyles(['transform', 'opacity']);
        leavingBackButton.afterClearStyles(['opacity']);
        leavingTitle.afterClearStyles(['opacity']);
        leavingToolBarButtons.afterClearStyles(['opacity']);
      }
    });
  }
  return Promise.resolve(rootTransition);
}

export function mdTransitionAnimation(AnimationC: Animation, _: HTMLElement, opts: any): Promise<Animation> {
  const getIonPageElement = function(element: HTMLElement) {
    if (element.classList.contains('ion-page')) { return element; }
    const ionPage = element.querySelector(':scope > .ion-page, :scope > ion-nav, :scope > ion-tabs');
    if (ionPage) { return ionPage; }
    return element;
  };
  const enteringEl = opts.enteringEl;
  const leavingEl = opts.leavingEl;
  const ionPageElement = getIonPageElement(enteringEl);
  const rootTransition = new AnimationC();
  rootTransition.addElement(ionPageElement).beforeRemoveClass('ion-page-invisible');
  const backDirection = (opts.direction === 'back');
  // animate the component itself
  if (backDirection) {
    rootTransition.duration(opts.duration || 200).easing('cubic-bezier(0.47,0,0.745,0.715)');
  } else {
    rootTransition
      .duration(opts.duration || 280)
      .easing('cubic-bezier(0.36,0.66,0.04,1)')
      .fromTo('translateY', '40px', '0px', true)
      .fromTo('opacity', 0.01, 1, true);
  }
  // Animate toolbar if it's there
  const enteringToolbarEle = ionPageElement.querySelector('ion-toolbar');
  if (enteringToolbarEle) {
    const enteringToolBar = new AnimationC();
    enteringToolBar.addElement(enteringToolbarEle);
    rootTransition.add(enteringToolBar);
  }
  // setup leaving view
  if (leavingEl && backDirection) {
    // leaving content
    rootTransition
      .duration(opts.duration || 200)
      .easing('cubic-bezier(0.47,0,0.745,0.715)');
    const leavingPage = new AnimationC();
    leavingPage
      .addElement(getIonPageElement(leavingEl))
      .fromTo('translateY', '0px', '40px')
      .fromTo('opacity', 1, 0);
    rootTransition.add(leavingPage);
  }
  return Promise.resolve(rootTransition);
}

function fadeAnimation(AnimationC: Animation, _: HTMLElement, opts: any) {
  const getIonPageElement = function (element: HTMLElement) {
    if (element.classList.contains('ion-page')) { return element; }
    const page = element.querySelector(':scope > .ion-page, :scope > ion-nav, :scope > ion-tabs');
    return page || element;
  };
  const enteringEl = opts.enteringEl;
  const leavingEl = opts.leavingEl;
  const ionPageElement = getIonPageElement(enteringEl);
  const rootTransition = new AnimationC();
  rootTransition.addElement(ionPageElement).beforeRemoveClass('ion-page-invisible');
  if (opts.direction === 'back') { // animate the component itself
    rootTransition.duration(opts.duration || 300).easing('cubic-bezier(0.47,0,0.745,0.715)');
  } else {
    rootTransition.duration(opts.duration || 400)
      .easing('cubic-bezier(0.36,0.66,0.04,1)').fromTo('opacity', 0.01, 1, true);
  }
  const enteringToolbarEle = ionPageElement.querySelector('ion-toolbar');
  if (enteringToolbarEle) { // Animate toolbar if it's there
    const enteringToolBar = new AnimationC();
    enteringToolBar.addElement(enteringToolbarEle);
    rootTransition.add(enteringToolBar);
  }
  // setup leaving view
  if (leavingEl && (opts.direction === 'back')) { // leaving content
    rootTransition.duration(opts.duration || 300).easing('cubic-bezier(0.47,0,0.745,0.715)');
    const leavingPage = new AnimationC();
    leavingPage.addElement(getIonPageElement(leavingEl)).fromTo('opacity', 1, 0);
    rootTransition.add(leavingPage);
  }
  return Promise.resolve(rootTransition);
}

function safePushAnimation(AnimationC: Animation, _: HTMLElement, opts: any) {
  const getIonPageElement = function (element: HTMLElement) {
    if (element.classList.contains('ion-page')) { return element; }
    const page = element.querySelector(':scope > .ion-page, :scope > ion-nav, :scope > ion-tabs');
    return page || element;
  };
  const enteringEl = opts.enteringEl;
  const leavingEl = opts.leavingEl;
  const ionPageElement = getIonPageElement(enteringEl);
  const rootTransition = new AnimationC();
  rootTransition.addElement(ionPageElement).beforeRemoveClass('ion-page-invisible');
  rootTransition.duration(opts.duration || 500).easing('cubic-bezier(0.36,0.66,0.04,1)');
  const leavingPage = new AnimationC();
  const enteringPage = new AnimationC();
  if (opts.direction === 'back') {
    leavingPage.addElement(getIonPageElement(leavingEl)).fromTo('translateX', '0', '100%');
    enteringPage.addElement(getIonPageElement(enteringEl)).fromTo('translateX', '-100%', '0');
  } else {
    leavingPage.addElement(getIonPageElement(leavingEl)).fromTo('translateX', '0', '-100%');
    enteringPage.addElement(getIonPageElement(enteringEl)).fromTo('translateX', '100%', '0');
  }
  rootTransition.add(leavingPage);
  rootTransition.add(enteringPage);
  return Promise.resolve(rootTransition);
}

