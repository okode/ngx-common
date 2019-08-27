import { Injectable } from '@angular/core';
import { Navigator } from './navigator.service';
import { Subject } from 'rxjs';
import { throttleTime, filter } from 'rxjs/operators';
import { Platform, NavController } from '@ionic/angular';

export interface OnHardwareBackButton {
  kdOnHardwareBackButton();
}

@Injectable()
export class HardwareBackButton {

  private intialized = false;
  private filterCondition = () => true;

  constructor(
    private navCtrl: NavController,
    private nav: Navigator,
    private platform: Platform
  ) {}

  enable(condition?: () => boolean) {
    if (!this.intialized) { this.init(); }
    this.filterCondition = condition || (() => true);
  }

  disable() {
    if (!this.intialized) { this.init(); }
    this.filterCondition = () => false;
  }

  private init() {
    this.intialized = true;
    const hwBackSubject = new Subject();
    hwBackSubject.pipe(
      throttleTime(500),
      filter(() => this.filterCondition()),
    ).subscribe(async () => {
      console.log('HardwareBackButton: back button action');
      // check ionic overlays (dismiss if is presented and backdropDismiss == true)
      const overlaySelector = 'ion-alert, ion-alert-controller, ' +
                              'ion-loading, ion-loading-controller, ' +
                              'ion-action-sheet, ion-action-sheet-controller' +
                              'ion-popover, ion-popover-controller';
      let overlay: any = document.querySelector(overlaySelector);
      if (overlay && overlay.getTop) { overlay = await overlay.getTop(); }
      if (overlay) {
        if (overlay && overlay.backdropDismiss === true) { overlay.dismiss(); }
        return;
      }
      // check if active view has implemented `onHardwareBack()`, else performs nav.pop()
      const view = this.getActiveViewRefInstance();
      if (view && view.kdOnHardwareBackButton) {
        view.kdOnHardwareBackButton();
      } else {
        this.nav.pop();
      }
    });
    // Overring default hardware back button behaviour (Android)
    this.platform.ready().then(() => {
      this.platform.backButton.subscribeWithPriority(9999, () => hwBackSubject.next());
    });
    // Overring default browser back button behaviour
    window.addEventListener('popstate', () => {
      history.pushState('mock_state_disable_forward_button', null, null);
      hwBackSubject.next();
    });
  }

  private getActiveViewRefInstance() {
    const nav: any = { ...this.navCtrl };
    if (nav && nav.topOutlet && nav.topOutlet.stackCtrl && nav.topOutlet.stackCtrl.activeView &&
        nav.topOutlet.stackCtrl.activeView && nav.topOutlet.stackCtrl.activeView.ref) {
      return nav.topOutlet.stackCtrl.activeView.ref.instance;
    }
    return null;
  }

}
