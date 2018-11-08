import express from 'express';
import fs from 'fs-extra';
import Log from 'log';
import morgan from 'morgan';
import path from 'path';

const DEFAULT_LOG_NAME = 'static-server.txt';

export default class StaticServerLauncher {
  onPrepare({
    staticServer: {folders, logging = false, port = 4567, middleware = [], staticOptions = {}}
  }) {
    if (!folders) {
      return Promise.resolve();
    }

    this.server = express();
    this.folders = folders;
    this.port = port;

    if (logging) {
      let stream;
      if (typeof logging === 'string') {
        const file = path.join(logging, DEFAULT_LOG_NAME);
        fs.createFileSync(file);
        stream = fs.createWriteStream(file);
      }
      this.log = new Log('debug', stream);
      this.server.use(morgan('tiny', { stream }));
    } else {
      this.log = new Log('emergency');
    }

    (Array.isArray(folders) ? folders : [ folders ]).forEach((folder) => {
      this.log.debug('Mounting folder `%s` at `%s`', path.resolve(folder.path), folder.mount);
      this.server.use(folder.mount, express.static(folder.path, staticOptions));
    });

    middleware.forEach((ware) => {
      this.server.use(ware.mount, ware.middleware);
    });

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (err) => {
        if (err) {
          reject(err);
        }

        this.log.info(`Static server running at http://localhost:${port}`);
        resolve();
      });
    });
  }

}
