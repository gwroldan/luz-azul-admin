// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  apiUrl: 'https://190.210.196.211:9569/api',
  firebase: {
    apiKey: 'AIzaSyCdiZ4mWRdFMvRSszHZjJLaKfTKnuRUQsc',
    authDomain: 'luz-azul-admin.firebaseapp.com',
    databaseURL: 'https://luz-azul-admin.firebaseio.com',
    projectId: 'luz-azul-admin',
    storageBucket: 'luz-azul-admin.appspot.com',
    messagingSenderId: '63877966030'
  }
};
