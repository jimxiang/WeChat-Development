// 回复的XML模版
'use strict';
const ejs = require('ejs');
const heredoc = require('heredoc');

const template = heredoc(function() {
    /*
        <xml>
        <ToUserName><![CDATA[<%= fromUserName %>]]></ToUserName>
        <FromUserName><![CDATA[<%= toUserName %>]]></FromUserName>
        <CreateTime><%= createTime %></CreateTime>
        <MsgType><![CDATA[<%= msgType %>]]></MsgType>
        <% if ('text' === msgType) { %>
            <Content><![CDATA[<%= content %>]]></Content>
        <% } else if ('image' === msgType) { %>
            <Image>
                <MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
            </Image>
        <% } else if ('voice' === msgType) { %>
            <Voice>
                <MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
            </Voice>
        <% } else if ('video' === msgType) { %>
            <Video>
                <MediaId><![CDATA[<%= content.media_id %>]]></MediaId>
                <Title><![CDATA[<%= content.title %>]]></Title>
                <Description><![CDATA[<%= content.description %>]]></Description>
            </Video> 
        <% } else if ('music' === msgType) { %>
            <Music>
                <Title><![CDATA[<%= content.title %>]]></Title>
                <Description><![CDATA[<%= content.description %>]]></Description>
                <MusicUrl><![CDATA[<%= content.music_url %>]]></MusicUrl>
                <HQMusicUrl><![CDATA[<%= content.HQ_music_url %>]]></HQMusicUrl>
                <ThumbMediaId><![CDATA[<%= content.media_id %>]]></ThumbMediaId>
            </Music>
        <% } else if ('news' === msgType) { %>
            <ArticleCount><%= content.length %></ArticleCount>
            <Articles>
                <% content.forEach(function(item) { %>
                <item>
                    <Title><![CDATA[<%= item.title %>]]></Title> 
                    <Description><![CDATA[<%= item.description %>]]></Description>
                    <PicUrl><![CDATA[<%= item.pic_url %>]]></PicUrl>
                    <Url><![CDATA[<%= item.url %>]]></Url>
                </item>
                <% }) %>
            </Articles>
        <% } %>
        </xml>
     */
});

const compiled = ejs.compile(template);

exports = module.exports = {
    compiled: compiled
}