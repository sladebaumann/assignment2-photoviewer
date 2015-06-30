/**
 * Created by theotheu on 31-01-15.
 * Borrowed from https://github.com/endlesshack/
 * Rewritten because we don't want to rely on jQuery (and it isn't necessary to do so)
 * Also rewritten because youtube doesn't allow CORS (Cross Origin Resource Sharing)
 */

(function () {
    "use strict";

    /**
     *
     * @param id, eg: Vpg9yizPP_g
     * @param proxyUrl, eg: http://server7.tezzt.nl:1332/api/proxy
     * @param cb, some callback function
     * @constructor
     */
    window.YoutubeVideo = function (id, proxyUrl, cb) {
        var bodyParams, ar, params, attributeName, xhr;

        bodyParams = {
            https: true,
            hostname: 'www.youtube.com',
            port: 443,
            path: '/get_video_info?video_id=' + id,
            method: 'GET'
        };

        // parse body parameters
        ar = [];
        for (attributeName in bodyParams) {
            if (bodyParams.hasOwnProperty(attributeName)) {
                ar.push(attributeName + '=' + bodyParams[attributeName]);
            }
        }
        params = ar.join("&");
        params = encodeURI(params);

        xhr = YoutubeVideo.createXHRRequest('POST', proxyUrl);
        xhr.onload = function () {
            return YoutubeVideo.processVideoInfo(JSON.parse(xhr.responseText), cb)
        };
        if (params !== '') {
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }
        xhr.send(params);

    };

    window.YoutubeVideo.createXHRRequest = function (method, url) {
        "use strict";
        var xhr, ar, attributeName, params;

        xhr = new XMLHttpRequest();

        if (xhr.withCredentials !== undefined) {
            // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest) {
            // XDomainRequest for IE.
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }
        return xhr;
    };

    window.YoutubeVideo.decodeQueryString = function (queryString) {
        var key, keyValPair, keyValPairs, r, val, _i, _len;
        r = {};
        keyValPairs = queryString.split("&");
        for (_i = 0, _len = keyValPairs.length; _i < _len; _i++) {
            keyValPair = keyValPairs[_i];
            key = decodeURIComponent(keyValPair.split("=")[0]);
            val = decodeURIComponent(keyValPair.split("=")[1] || "");
            r[key] = val;
        }
        return r;
    };

    window.YoutubeVideo.decodeStreamMap = function (url_encoded_fmt_stream_map) {
        var quality, sources, stream, type, urlEncodedStream, _i, _len, _ref;
        sources = {};
        _ref = url_encoded_fmt_stream_map.split(",");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            urlEncodedStream = _ref[_i];
            stream = YoutubeVideo.decodeQueryString(urlEncodedStream);
            type = stream.type.split(";")[0];
            quality = stream.quality.split(",")[0];
            stream.original_url = stream.url;
            stream.url = "" + stream.url + "&signature=" + stream.sig;
            sources["" + type + " " + quality] = stream;
        }
        return sources;
    };

    window.YoutubeVideo.processVideoInfo = function (videoInfo, cb) {
        var video;

        video = YoutubeVideo.decodeQueryString(videoInfo.body);

        if (video.status === "fail") {
            return cb(video);
        }

        video.sources = YoutubeVideo.decodeStreamMap(video.url_encoded_fmt_stream_map);

        video.getSource = function (type, quality) {
            var exact, key, lowest, source, _ref;
            lowest = null;
            exact = null;
            _ref = this.sources;
            for (key in _ref) {
                source = _ref[key];
                if (source.type.match(type)) {
                    if (source.quality.match(quality)) {
                        exact = source;
                    } else {
                        lowest = source;
                    }
                }
            }
            return exact || lowest;
        };

        return cb(video);
    };

}());