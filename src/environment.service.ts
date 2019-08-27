import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage';
import { ActionSheetController, Platform, Events } from '@ionic/angular';

@Injectable()
export class Environment {

  private static isReady = false;
  private static environmentConfig: any = {};

  private readonly JSON_PATH = 'assets/environments.json';
  private readonly SELECTED_ENVIRONMENT_KEY = 'selectedEnvironmentKey';
  private isInitializing = false;
  private readyPromiseResolve: ((value?: void | PromiseLike<void>) => void)[] = [];
  private readyPromiseReject: ((reason?: any) => void)[] = [];

  constructor(
    private http: HttpClient,
    private storage: Storage,
    private actionSheetCtrl: ActionSheetController,
    private platform: Platform,
    private events: Events
  ) {}

  static config() {
    if (!Environment.isReady) {
      console.error(`Environment config is not ready (wait for Environment.ready())`);
    }
    return Environment.environmentConfig;
  }

  ready() {
    if (Environment.isReady) { return Promise.resolve(); }
    if (!this.isInitializing) {
      this.isInitializing = true;
      this.initEnvs();
    }
    return new Promise<void>((resolve, reject) => {
      this.readyPromiseResolve.push(resolve);
      this.readyPromiseReject.push(reject);
    });
  }

  private initEnvs() {
    this.http.get(this.JSON_PATH).subscribe(json => {
      if (json == null || Object.keys(json).length === 0) {
        this.readyPromiseReject.forEach((reject) => reject());
        console.error(`EnvironmentService fails: '${this.JSON_PATH}' is empty or invalid`);
        return;
      }
      const environments = Object.keys(json).filter(environment => environment !== 'default');
      if (environments == null || environments.length === 0) {
        this.setEnv(false, 'default', json['default']);
      } else {
        this.storage.ready().then(() => {
          this.storage.get(this.SELECTED_ENVIRONMENT_KEY).then(storedEnvironment => {
            if (storedEnvironment == null) {
              if (environments.length > 1) {
                console.log('No saved environment detected, will prompt user for selection');
                this.events.publish('ngx_common:environment_prompted');
                this.showEnvironmentActionSheet(environments, json);
              } else {
                const environment = environments[0];
                this.setEnv(true, environment, json['default'], json[environment]);
              }
            } else {
              console.log(`Detected saved environment: ${storedEnvironment}`);
              this.setEnv(false, storedEnvironment, json['default'], json[storedEnvironment]);
            }
          });
        });
      }
    }, err => {
      console.log(err);
      console.error(`EnvironmentService fails: Not found '${this.JSON_PATH}'`);
      this.readyPromiseReject.forEach((reject) => reject());
    });
  }

  private setEnv(save: boolean, environmentKey: string, configBase: any, configEnvironment?: any) {
    console.log(`Applying environment: ${environmentKey}`);
    Environment.environmentConfig = configBase;
    if (configEnvironment != null) {
      Environment.environmentConfig = { ...configBase, ...configEnvironment };
    }
    if (save) {
      console.log(`Saving environment: ${environmentKey}`);
      this.storage.set(this.SELECTED_ENVIRONMENT_KEY, environmentKey);
    }
    Environment.isReady = true;
    this.readyPromiseResolve.forEach((resolve) => resolve());
  }

  private async showEnvironmentActionSheet(environments: string[], configs: any) {
    await this.platform.ready();
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Select environment',
      backdropDismiss: false,
      buttons: environments.map(environment => ({
        text: environment,
        handler: () => {
          this.setEnv(true, environment, configs['default'], configs[environment]);
        }
      }))
    });
    actionSheet.present();
  }

}
