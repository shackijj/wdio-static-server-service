import express from 'express';
import fs from 'fs-extra';
import Log from 'log';
import morgan from 'morgan';
import path from 'path';
import http from 'http';
import https from 'https';

const DEFAULT_LOG_NAME = 'static-server.txt';

export default class StaticServerLauncher {
  onPrepare({
    staticServer: {folders, logging = false, port = 4567, middleware = [], staticOptions = {}},
    useHttps = false,
    certOptions = {}
  }) {
    if (!folders) {
      return Promise.resolve();
    }

    this.app = express();
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
      this.app.use(morgan('tiny', { stream }));
    } else {
      this.log = new Log('emergency');
    }

    (Array.isArray(folders) ? folders : [ folders ]).forEach((folder) => {
      this.log.debug('Mounting folder `%s` at `%s`', path.resolve(folder.path), folder.mount);
      this.app.use(folder.mount, express.static(folder.path, staticOptions));
    });

    middleware.forEach((ware) => {
      this.app.use(ware.mount, ware.middleware);
    });

    return new Promise((resolve, reject) => {
      this.app.listen = function () {
        const server = useHttps ? https.createServer(certOptions, this) : http.createServer(this)
        return server.listen.apply(server, arguments)
      }
      this.server = this.app.listen(this.port, (err) => {
        if (err) {
          reject(err);
        }

        this.log.info(`Static server running at http://localhost:${port}`);
        resolve();
      });
    });
  }
  onComplete() {
    this.server.close();
  }
}
