'use strict';

const Koa = require('koa');
const crypto = require('crypto');
const generator = require('./wechat/generator');
const config = require('./config');
const reply = require('./wx/reply');
const ejs = require('ejs');
const heredoc = require('heredoc');
const Wechat = require('./wechat/wechat');

const app = new Koa();

// html模版
const tmpl_audio = heredoc(function() {/*
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1">
        <title>搜电影</title>
    </head>
    <body>
        <h1>点击标题，开始录制翻译</h1>
        <div id="title"></div>
        <div id="director"></div>
        <div id="year"></div>
        <div id="poster"></div>

        <script src="http://zeptojs.com/zepto-docs.min.js"></script>
        <script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>

        <script>
            wx.config({
                debug: false,
                appId: '',
                timestamp: '<%= timestamp %>',
                nonceStr: '<%= nonceStr %>',
                signature: '<%= signature %>',
                jsApiList: [
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage',
                    'onMenuShareQQ',
                    'onMenuShareWeibo',
                    'onMenuShareQZone',
                    'previewImage',
                    'startRecord',
                    'stopRecord',
                    'onVoiceRecordEnd',
                    'translateVoice'
                ]
            });
            wx.ready(function() {
                wx.checkJsApi({
                    jsApiList: ['onVoiceRecordEnd'],
                    success: function(res) {
                        console.log(res);
                    }
                });

                var isRecording = false,
                    slides = {},
                    shareContent = {
                        title: '电影搜索工具',
                        desc: '',
                        link: '',
                        imgUrl: '',
                        type: 'link',
                        dataUrl: '',
                        success: function () {},
                        cancel: function () {}
                    };

                wx.onMenuShareAppMessage(shareContent);

                $('h1').bind('tap', function() {
                    if(!isRecording) {
                        isRecording = true;
                        wx.startRecord({
                            cancel: function() {
                                window.alert('那就不能搜了哦');
                            }
                        });
                        return;
                    }
                    isRecording = false;
                    wx.stopRecord({
                        success: function (res) {
                            var localId = res.localId;
                            wx.translateVoice({
                                localId: localId,
                                isShowProgressTips: 1,
                                success: function (res) {
                                    alert(res.translateResult);
                                    var result = res.translateResult;
                                    $.ajax({
                                        type: 'get',
                                        url: 'https://api.douban.com/v2/movie/search?q=' + result,
                                        dataType: 'jsonp',
                                        jsonp: 'callback',
                                        success: function(data) {
                                            var subject = data.subjects[0];
                                            $('#title').html(subject.title);
                                            $('#director').html(subject.directors[0].name);
                                            $('#year').html(subject.year);
                                            $('#poster').html('<img src=" + subject.images.large + ">');

                                            shareContent = {
                                                title: subject.title,
                                                desc: '我搜出来了' + subject.title,
                                                link: subject.alt,
                                                imgUrl: subject.images.large,
                                                type: 'link',
                                                dataUrl: '',
                                                success: function () {},
                                                cancel: function () {}
                                            }

                                             slides = {
                                                current: subject.images.large,
                                                urls: [subject.images.large]
                                            };
                                            data.subjects.forEach(function(item) {
                                                slides.urls.push(item.images.large);
                                            });
                                            wx.previewImage({
                                                current: '',
                                                urls: []
                                            });

                                            wx.onMenuShareAppMessage(shareContent);
                                        }
                                    })
                                }
                            });
                        }
                    });
                });

                $('#poster').bind('tap', function() {
                    wx.previewImage(slides );
                });
            });
        </script>
    </body>
    </html>
*/});

const tmpl_test = heredoc(function() {/*
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1, minimum-scale=1">
        <title>测试</title>
    </head>
    <body>
        <div id="url"><%= url %></div>
        <div id="open_id"><%= token %></div>

        <script src="http://zeptojs.com/zepto-docs.min.js"></script>
        <script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>

        <script>
            wx.config({
                debug: false,
                appId: '',
                timestamp: '<%= timestamp %>',
                nonceStr: '<%= nonceStr %>',
                signature: '<%= signature %>',
                jsApiList: [
                    'onMenuShareTimeline',
                    'onMenuShareAppMessage',
                    'onMenuShareQQ',
                    'onMenuShareWeibo',
                    'onMenuShareQZone',
                    'startRecord',
                    'stopRecord',
                    'onVoiceRecordEnd',
                    'translateVoice'
                ]
            });
            wx.ready(function() {
                wx.checkJsApi({
                    jsApiList: ['onVoiceRecordEnd'],
                    success: function(res) {
                        console.log(res);
                    }
                });
            });
        </script>
    </body>
    </html>
*/});

const createNonce = function() {
    return Math.random().toString(36).substr(2, 15);
}

const createTimetamp = function() {
    return parseInt(new Date().getTime() / 1000, 10) + '';
}

const _sign = function(nonceStr, timestamp, ticket, url) {
    let params = [
        'noncestr=' + nonceStr,
        'jsapi_ticket=' + ticket,
        'timestamp=' + timestamp,
        'url=' + url],
        str = params.sort().join('&'),
        shasum = crypto.createHash('sha1');
    shasum.update(str);
    return shasum.digest('hex');
}

const sign = function(ticket, url) {
    let nonceStr = createNonce(),
        timestamp = createTimetamp(),
        signature = _sign(nonceStr, timestamp, ticket, url);

    return {
        nonceStr: nonceStr,
        timestamp: timestamp,
        signature:  signature
    }
}

// 路由中间件，返回html
app.use(function *(next) {
    if(this.url.indexOf('/movie') > -1) {
        let wechatApi = new Wechat(config.wechat),
            data = yield wechatApi.fetchAccessToken(),
            access_token = data.access_token;

        let ticketData = yield wechatApi.fetchTicket(access_token),
            ticket = ticketData.ticket;

        let url = this.href,
            params = sign(ticket, url);
            
        console.log(params);
        console.log(url);
        this.body = ejs.render(tmpl_audio, params);

        return next;
    }
    if(this.url.indexOf('/test') > -1) {
        let wechatApi = new Wechat(config.wechat),
            data = yield wechatApi.fetchAccessToken(),
            access_token = data.access_token;

        let ticketData = yield wechatApi.fetchTicket(access_token),
            ticket = ticketData.ticket;
        
        let url = this.href,
            params = sign(ticket, url);

        params.url = url;
        params.token = access_token;
        
        // let info = yield getRawBody(this.req, {
        //     length: this.length,
        //     limit: '1mb',
        //     encoding: this.charset
        // });
        // let content = yield util.parseXMLAsync(info);
        // console.log(content);
        // let message = util.formatMessage(content.xml);
        // console.log(message);

        this.body = ejs.render(tmpl_test, params);

        return next;
    }
    yield next;
});

// 消息中间件，处理微信回复
app.use(generator(config.wechat, reply.reply));

app.listen(8080, function() {
    console.log('App listening at 8080');
});