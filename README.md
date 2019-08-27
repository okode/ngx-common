# Okode NGX Common

## Services

* Environmnet
* HardwareBackButton
* HttpCacheInterceptor
* Navigator

## Importing library

Add package dependency from GitHub:

```bash
$ npm i okode/ngx-common --save-dev
```

Include `node_modules/@okode/ngx-common/src/**/*.ts` as source to your `tsconfig.app.json` file:

```json
"include": [
  "src/**/*.ts",
  "node_modules/@okode/ngx-common/src/**/*.ts"
]
```

Add `@okode/ngx-common` path to your `tsconfig.json` file:

```json
"paths": {
  "@okode/ngx-common": [
    "node_modules/@okode/ngx-common/src"
  ]
}
```

Register `OkodeNgxCommonModule` in your `app.module.ts`:

```typescript
import { NgModule } from '@angular/core';
import { OkodeNgxCommonModule } from '@okode/ngx-common';
import { IonicStorageModule } from '@ionic/storage';
import { HttpClientModule } from '@angular/common/http';
import { File } from '@ionic-native/file/ngx';
import { Device } from '@ionic-native/device/ngx';

@NgModule({
  imports: [
    IonicStorageModule.forRoot(), // Required
    HttpClientModule, // Required
    OkodeNgxCommonModule.forRoot(),
    ...
  ]
})
export class AppModule {}
```

## Publishing library

```
$ release.sh [CURRENT_VERSION] [NEXT_VERSION]
```
