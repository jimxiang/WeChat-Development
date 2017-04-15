// 处理微信公众号各种回复
'use strict';
const config = require('../config');
const Wechat = require('../wechat/wechat');
const path = require('path');
const wechatApi = new Wechat(config.wechat);
const menu = require('./menu');

wechatApi.deleteMenu()
.then(function() {
    return wechatApi.createMenu(menu);
})
.then(function(msg) {
    console.log(msg);
})

exports.reply = function* (next) {
    let message = this.weixin;
    if('event' === message.MsgType) {
        if('subscribe' === message.Event) {
            if(message.EventKey) {
                console.log('扫描二维码进来： ' +
                    message.EventKey + 
                    message.ticket);
            }
            this.body = '欢迎您订阅这个公众号\r\n' + '消息ID: ' + message.MsgId;
        } else if('unsubscribe' === message.Event) {
            console.log('无情取关');
            this.body = '';
        } else if('LOCATION' === message.Event) {
            this.body = '您上报的位置是： ' + message.Latitude + '/' + message.Longitude + '-' + message.Precision;
        } else if('CLICK' === message.Event) {
            this.body = '您点击了菜单： ' + message.EventKey;
        } else if('SCAN' === message.Event) {
            console.log('关注后扫二维码： ' + message.EventKey + ' ' + message.Ticket);
            this.body = '看到您扫了一下哦';
        } else if('VIEW' === message.Event) {
            this.body = '您点击了菜单中的链接： ' + message.EventKey;
        } else if('scancode_push' === message.Event) {
            console.log(message.ScanCodeInfo.ScanType);
            console.log(message.ScanCodeInfo.ScanResult);
            this.body = '您点击了菜单中的： ' + message.EventKey;
        } else if('scancode_waitmsg' === message.Event) {
           console.log(message.ScanCodeInfo.ScanType);
            console.log(message.ScanCodeInfo.ScanResult); 
            this.body = '您点击了菜单中的： ' + message.EventKey;
        } else if('pic_sysphoto' === message.Event) {
            console.log(message.SendPicsInfo.PicList);
            console.log(message.SendPicsInfo.Count);
            this.body = '您点击了菜单中的： ' + message.EventKey;
        } else if('pic_photo_or_album' === message.Event) {
            console.log(message.SendPicsInfo.PicList);
            console.log(message.SendPicsInfo.Count);
            this.body = '您点击了菜单中的： ' + message.EventKey;
        } else if('pic_weixin' === message.Event) {
            console.log(message.SendPicsInfo.PicList);
            console.log(message.SendPicsInfo.Count);
            this.body = '您点击了菜单中的： ' + message.EventKey;
        } else if('location_select' === message.Event) {
            console.log(JSON.stringify(message.SendLocationInfo));
            // console.log(message.SendLocationInfo.Location_X);
            // console.log(message.SendLocationInfo.Location_Y);
            // console.log(message.SendLocationInfo.Scale);
            // console.log(message.SendLocationInfo.Label);
            // console.log(message.SendLocationInfo.Poiname);
            this.body = '您点击了菜单中的： ' + message.EventKey;
        }
    } else if('text' === message.MsgType){
        let content = message.Content,
            reply = '额，你说的 ' + message.Content+ ' 太复杂了';
        if('1' === content) {
            reply = '你输入了1';
        } else if('2' === content) {
            reply = '你输入了2';
        } else if('3' === content) {
            reply = '你输入了3';
        } else if('4' === content) {
            reply = [{
                title: '技术改变世界',
                description: '只是个描述而已',
                pic_url: '',
                url: ''
            }];
        } else if('5' === content) {
            // 个人类型的订阅号（即未审核）不能使用素材上传接口！
            let data = yield wechatApi.uploadMaterial('image', path.join(__dirname, 'xxx.jpeg'));
            console.log(data);
            reply = {
                type: 'image',
                media_id: data.media_id
            };
        } else if('6' === content) {
            // 测试账号上传长传视频素材会超时，导致5秒内不能提供回复，打印出的data和reply都是正常的，原因可能是测试账号有限制
            let data = yield wechatApi.uploadMaterial('video', path.join(__dirname, 'xxx.mp4'));
            console.log(data);
            reply = {
                type: 'video',
                title: '测试功能',
                description: '随便拍拍',
                media_id: data.media_id
            }
            console.log(reply);
        } else if('7' === content) {
            let data = yield wechatApi.uploadMaterial('image', path.join(__dirname, 'xxx.jpeg'));
            console.log(data);
            reply = {
                type: 'music',
                title: '回复音乐内容',
                description: '放松一下',
                musicUrl: '',
                thumbMediaId: data.media_id
            };
            console.log(reply);
        } else if('8' === content) {
            // 上传永久素材
            let data = yield wechatApi.uploadMaterial('image', path.join(__dirname, 'xxx.jpeg'), {type: 'image'});
            
            reply = {
                type: 'image',
                media_id: data.media_id
            };
        } else if('9' === content) {
            // 上传永久素材
            let data = yield wechatApi.uploadMaterial('video', path.join(__dirname, 'xxx.mp4'), {type: 'video', description: '{"title": "nice", "introduction": "hhhh"}'});
            console.log(data);
            
            reply = {
                type: 'video',
                media_id: data.media_id,
                title: '测试功能',
                description: '随便拍拍'
            };
        } else if('10' === content) {
            let picData = yield wechatApi.uploadMaterial('image', path.join(__dirname, 'xxx.jpeg'), {});
            console.log(picData);

            let media = {
                articles: [{
                    title: 'image',
                    thumb_media_id: picData.media_id,
                    author: '',
                    digest: 'nothing',
                    show_cover_pic: 1,
                    content: 'nothing',
                    content_source_url: ''
                }]
            };

            let upload_data = yield wechatApi.uploadMaterial('news', media, {});
            let fetch_data = yield wechatApi.fetchMaterial(upload_data.media_id, 'news', {});

            console.log(upload_data);
            console.log(fetch_data);

            let items = fetch_data.news_item,
                news = [];

            items.forEach(function(element) {
                news.push({
                    title: element.title,
                    description: element.digest,
                    picUrl: picData.url,
                    url: element.url
                })
            });
            
            reply = news;
        } else if('11' === content) {
            let data = yield wechatApi.getMaterialCount(),
                list = yield wechatApi.getMaterialList({
                    type: 'news',
                    offset: 0,
                    count: 10
                });
            console.log(data);
            console.log(list);
        } else if('12' === content) {
            // let group = yield wechatApi.createGroup('wechat');
            // console.log('新分组：wechat');
            // console.log(group);

            let groupList = yield wechatApi.getGroup();
            console.log('分组列表：');
            console.log(groupList);

            // message.FromUserName即为openId
            // 没有权限！
            // let myGroup = wechatApi.checkGroup(message.FromUserName);
            // console.log('查看自己的分组：');
            // console.log(myGroup);

            let moveGroup = yield wechatApi.moveGroup(message.FromUserName, 2);
            console.log(moveGroup);

            let moveGroupList = yield wechatApi.getGroup();
            console.log('分组列表：');
            console.log(moveGroupList);

            reply = 'Group test';


        } else if('13' === content) {
            let user = yield wechatApi.getUser(message.FromUserName);
            console.log(user);
        } else if('14' === content){
            let userList = yield wechatApi.getUserList();
            console.log(userList);
            reply = 'Get user list';
        } else if('15' === content){
            // 需要素材 id 以及分组 id
            // let mpnews = {
            //         media_id: 'Y17tdqOqUA5wZS-_Mm966rv7EBv8HU_oUke_wY2HEaI'
            //     },
            //     msgData = yield wechatApi.sendByGroup('mpnews', mpnews, '2'); // 测试号貌似没有权限发图文

            let text  ={
                    content: 'text test'
                },
                textData = yield wechatApi.sendByGroup('text', text, '2');

            console.log(textData);
            reply = 'Send to group';
        } else if('16' === content){
            // 需要素材 id 以及分组 id
            let mpnews = {
                    media_id: 'Y17tdqOqUA5wZS-_Mm966rv7EBv8HU_oUke_wY2HEaI'
                },
                msgData = yield wechatApi.previewMass('mpnews', mpnews, message.FromUserName); // 测试号可以预览！

            // let text  ={
            //         content: 'text test'
            //     },
            //     textData = yield wechatApi.previewMass('text', text, '2');

            console.log(msgData);
            reply = 'Send to group';
        } else if('17' === content){
            let check = yield wechatApi.checkMass('1000000001');

            console.log(check);
            reply = 'Check mass';
        }  else if('18' === content){
            // 创建二维码
            let tempQr = {
                    expire_seconds: 604800,
                    action_name: 'QR_SCENE',
                    action_info: {
                        scene: {
                            scene_id: 123
                        }
                    }
                },
                permQr = {
                    action_name: 'QR_LIMIT_SCENE',
                    action_info: {
                        scene: {
                            scene_id: 123
                        }
                    }
                },
                permStrQr = {
                    action_name: 'QR_LIMIT_STR_SCENE',
                    action_info: {
                        scene: {
                            scene_str: '123'
                        }
                    }
                };
            let qr_1 = yield wechatApi.createQrcode(tempQr),
                qr_2 = yield wechatApi.createQrcode(permQr),
                qr_3 = yield wechatApi.createQrcode(permStrQr);

            console.log(check);
            reply = 'Check mass';
        } else if('19' === content) {
            let longUrl = '',
                shortData = yield wechatApi.createShorturl(null, longUrl); 

            reply = shortData.short_url;
        } else if('20' === content) {
            let semanticData = {
                query:"查一下明天从北京到上海的南航机票",
                city:"北京",
                category: "flight,hotel",
                appid: config.wechat.appID,
                uid: message.FromUserName
            };
            let _semanticData = yield wechatApi.semantic(semanticData);

            console.log(_semanticData);

            reply = JSON.stringify(_semanticData);
        }
        this.body = reply;
    } else if('image' === message.MsgType){
        this.body = 'image';
    } else if('' === message.MsgType){

    } else if('' === message.MsgType){

    } else if('' === message.MsgType){

    } else if('' === message.MsgType){

    }
    yield next;
}