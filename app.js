'use strict';

const Koa = require('koa');
const path = require('path');
const generator = require('./wechat/generator');
const util = require('./libs/util');
const access_token_file = path.join(__dirname, './config/access_token.txt');
const config = {
    wechat: {
        appID: '',
        appSecret: '',
        token: '',
        getAccessToken: () => {
            return util.readFileAsync(access_token_file, 'utf-8');
        },
        setAccessToken: (data) => {
            data = JSON.stringify(data);
            return util.writeFileAsync(access_token_file, data);
        }
    }
}
const app = new Koa();

app.use(generator(config.wechat));

app.listen(8080, function() {
    console.log('App is starting!');
});