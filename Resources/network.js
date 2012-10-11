/*global Ru: false, Ti: false, alert: false */
/*jslint continue: true*/

Network = {};

/*
   Class: cache
   Singleton.  An object for retrieving and caching data.
*/
Network.cache = (function () {
   "use strict";
   var pub = {}, priv = {};
   Network.Timeout = 120000;
   
   /*
      Group: Constants
   
      Constants: Cache check return values
   
      CACHE_CHECK_OLD      - data is in cache, but older then expire time
      CACHE_CHECK_USABLE   - data is in cache and not older then expire time
      CACHE_CHECK_NONE     - no data in cache
   */

   Network.CACHE_CHECK_OLD      = 0;
   Network.CACHE_CHECK_USABLE   = 1;
   Network.CACHE_CHECK_NONE     = 2;
   
   /*
      Constants: Success / error function status values
      These values are passed to successFunc and errorFunc of asyncPost.
   
      CACHE_NONE        - no data is available at all; there is no network and
                          no data in cache
      CACHE_FRESH       - data is freshly retreived
      CACHE_OLD         - cache data is old and no new data could be retreived
      CACHE_CACHED      - data is in cache and not expired
      CACHE_ERROR       - returned when there is an error (never actually returned)
   */
   
   Network.CACHE_NONE     = -1;
   Network.CACHE_FRESH    = 0;
   Network.CACHE_OLD      = 1;
   Network.CACHE_CACHED   = 2;
   Network.CACHE_ERROR    = 3;
   
   /*
      Constants: Misc. data related constants
   
      CACHE_INVALIDATE  - Can be passed to run to force cache to be invalidated
      PARSE_ERROR       - often used by success functions to inform error functions that a parse error occurred
   */
   
   Network.CACHE_INVALIDATE  = -1;
   Network.PARSE_ERROR       = 100;
   
   /*
      Group: Functions
   
      Function: run
      Checks to see if data is cached; if not, retrieves it.  If data is able
      to be retrieved in any way, successFunc is called.  See the status parameter
      (one of the constants listed above) for information about the data retrieved.
      The error function is only called if no data was able to be retrieved.
   
      Parameters:
         url            - *string* the url on which to run the request; priv 
                          is hashed and used as the cache filename
         successFunc    - *function (data, date, status, userData, xhr)* to be
                          called upon success
         errorFunc      - *function (status, httpStatus, userData, xhr)* to be
                          called upon error
         userData       - arbitrary user data passed to successFunc and errorFunc
                          (not required)
   
      Returns:
         *object* The xhr object created for priv request.  priv
         request can be aborted by calling xhr.abort().
   
      See Also:
         <Success / error function status values>
   */
   pub.run = function (url, exp, successFunc, errorFunc, userData) {
      if (typeof url !== "string") {
//         Ru.info(5, "cache: bad url input: " + url);
         return false;
      }
//      Ru.info(5, "cache: run requested on url: " + url + " exp: " + exp);
      var xhr = Ti.Network.createHTTPClient ();
      var url_noparams = url.split("?");
      var url_noparams = url_noparams[0];
      var file = Ti.Utils.md5HexDigest (url_noparams);
      var cc, data;

      var __run = function (cacheCheck) {
         xhr.fileName = file;
         xhr.url = url;
         xhr.myUrl = url;
         xhr.successFunc = successFunc;
         xhr.errorFunc = errorFunc;
         xhr.userData = userData;
         xhr.cacheCheck = cacheCheck;
      
//         if (Ru.debugOpts.simNoData === true) {
//            Ru.info (5, "cache: simulating no data, returning CACHE_NONE");
//            errorFunc (Ru.CACHE_NONE, 0, userData, xhr);
//            return xhr;
//         }
      
         if (cacheCheck === Network.CACHE_CHECK_OLD) {
            if (Ti.Network.online === true) {
               priv.asyncGrab (xhr);
            } else {
               data = priv.read(file);
               if ((data !== null) && (data !== undefined) && (data !== "")) {
                  successFunc (data, priv.modDate(file), Network.CACHE_OLD, userData, xhr);
               } else {
                  errorFunc (Network.CACHE_NONE, 0, userData, xhr);
               }
            }
         }
         else if (cacheCheck === Network.CACHE_CHECK_NONE) {
            if (Ti.Network.online) {
               priv.asyncGrab (xhr);
            } else {
               errorFunc (Network.CACHE_NONE, 0, userData, xhr);
            }
         }
         else if (cacheCheck === Network.CACHE_CHECK_USABLE) {
            data = priv.read(file);
            if ((data !== null) && (data !== undefined) && (data !== "")) {
               successFunc (data, priv.modDate(file), Network.CACHE_CACHED, userData, xhr);
            } else {
//               Ru.info (5, "cache: tried to load out of cache but got bad data");
    //           errorFunc (Ru.CACHE_NONE, 0, userData, xhr);
               // if it borked, re-run, but expire the cache this time
               if (exp !== Network.CACHE_INVALIDATE) {
                  return pub.run (url, Network.CACHE_INVALIDATE, 
                     successFunc, errorFunc, userData);
               }
            }
         }
      };

      if (exp === Network.CACHE_INVALIDATE) {
         __run(Network.CACHE_CHECK_OLD);
      } else {
         priv.check (file, exp, url, __run);
      }
      return xhr;
   };
   
   /*
      Function: asyncPost
      Posts data to a url asyncronously.
   
      Parameters:
         url       - *string* the URL to post the data to
         data      - *string* the data to post in json format
         onSuccess - *function (event)* to call on success, event.source
                     will be the xhr object
         onError   - *function (event)* to call on error, event.source
                     will be the xhr object
   
      Returns:
         *object* The xhr object created for the request.
   */
   pub.asyncPost = function (url, data, onSuccess, onError, userData, onSendStream) {
      var xhr = Ti.Network.createHTTPClient ();
      xhr.url = url;
      xhr.successFunc = onSuccess;
      xhr.errorFunc = onError;
      xhr.stream = onSendStream;
      xhr.userData = userData;
      
      if (typeof data !== "object") {    // fatal bad error
         alert ('cache: asyncPost: data is not an object!');
         return;
      }
   
      priv.asyncPost(xhr, data);
   };
   
   priv.asyncPost = function(xhr, data)
   {
   	xhr.onerror = priv.errorFunc;
      xhr.onload = priv.successFunc;
      xhr.onsendstream = priv.onSendStream
      xhr.cacheCheck = Network.CACHE_CHECK_NONE;
      xhr.timeout = Network.Timeout;
      xhr.setTimeout (Network.Timeout);
      xhr.open ("POST", xhr.url);
      xhr.timeout = Network.Timeout;
      xhr.setTimeout (Network.Timeout);
      xhr.send (data);
      xhr.timeout = Network.Timeout;
      xhr.setTimeout (Network.Timeout);
      // setup a manual timeout
      setTimeout (function() { priv.timeout (xhr); }, Network.Timeout+500);
   };
   
   priv.onSendStream = function(e)
   {
   	var xhr = e.source;
   	
   	if (xhr.stream != undefined)
   	
   	xhr.stream(e.progress);
   };
   
   /*
      Group: Private Functions
      These are mostly internal and helper functions.  You probably should
      not be calling these.
      
      Function: successFunc
      The success function for the xhr requests; places retreived data into
      cache and calls the user's provided successFunc.
   
      Parameters:
         e        - *object* the event provided by titanium
   */
   priv.successFunc = function (e) {
      var xhr = e.source;
      if (xhr.status !== 200) {
         priv.errorFunc(e);
         return;
      }
      // write data to cache
      priv.write (xhr.fileName, xhr.responseData);
      // return the fresh data to the callback function
      xhr.successFunc (xhr.responseData, new Date(), Network.CACHE_FRESH, xhr.userData, xhr);
   };
   
   /*
      Function: timeout
      priv is a manual timeout function; sometimes xhr requests will fail but
      the error function is not called.  priv function is here to prevent
      priv situation from occuring.  It's called from setTimeout() at the end
      of asyncGrab().
   
      Parameters:
         xhr      - *object* the xhr object for the request
   */
   priv.timeout = function (xhr) {
      if ((xhr.status !== 200) && (xhr.errorFuncCalled !== true)) {
//         Ru.info (5, "cache: manual timeout on url: " + xhr.myUrl);
         priv.errorFunc ({source:xhr});
      }
   };
   
   /*
      Function: errorFunc
      The error function for xhr GET requests.
   
      Parameters:
         e     - *object* the event object provided by titanium
   */
   priv.errorFunc = function (e) {
      var xhr = e.source;
      e.source.errorFuncCalled = true;
      //Ru.info(5, "cache: error while running request: " + e.error);
      if (xhr.cacheCheck !== Network.CACHE_CHECK_NONE) { // but wait -- there may still be
         var data = priv.read(xhr.fileName);
         if (data === null) {
            //Ru.info(5, "cache: something weird happened, CACHE_CHECK_OLD but no actual data.. running error function");
            xhr.errorFunc (Network.CACHE_NONE, xhr.status, xhr.userData, xhr);
         } else {
            xhr.successFunc (priv.read(xhr.fileName), priv.modDate(xhr.fileName), Network.CACHE_OLD, xhr.userData, xhr);
         }
      } else {  // nothing else we can do.. run error func
         //Ru.info (5, "cache: request timed out and no cache.. failing badly");
         xhr.errorFunc (Network.CACHE_NONE, xhr.status, xhr.userData, xhr);
      }
   };
   
   /*
      Function: asyncGrab
      priv function sets up a Ti xhr object for retreiving data and starts
      the request.
   
      Parameters:
         xhr      - *object* the xhr object to setup
   */
   priv.asyncGrab = function (xhr) {
//      Ru.info (5, "cache: asyncGrab on url: " + xhr.url);
      xhr.onerror = priv.errorFunc;
      xhr.onload = priv.successFunc;
      xhr.timeout = Network.Timeout;
      xhr.setTimeout (Network.Timeout);
      xhr.open ("GET", xhr.url);
      xhr.timeout = Network.Timeout;
      xhr.setTimeout (Network.Timeout);
      xhr.send ();
      xhr.timeout = Network.Timeout;
      xhr.setTimeout (Network.Timeout);
      // setup a manual timeout
      setTimeout (function() { priv.timeout (xhr); }, Network.Timeout+500);
   };
   
   /*
      Function: readurl
      Reads the cache of a given url
   
      Parameters:
         url   - *string* url to read out of cache
      
      Returns:
         *string* The data retreived out of cache
   */
   pub.readurl = function (url) {
      var filename = Ti.Utils.md5HexDigest(url);
      return priv.read (filename);
   };
   
   /*
      Function: read
      Reads the cache of a given file name, which should be a md5 hash of a url.
   
      Parameters:
         file_name      - *string* name of the file to read
   
      Returns:
         *string* The data retrieved out of cache
   */
   priv.read = function(file_name) {
      var path = Ti.Filesystem.getApplicationDataDirectory()+'/cache/'+file_name;
      var data = Ti.Filesystem.getFile(path);
   
      if (!(data.exists()) || (typeof data.read === "undefined")) {
         //Ru.info(5, "cache.read: file does not exist");
         return null;
      } else {
         try {
            return data.read();
         } catch (e) {
            //Ru.info(5, "cache.read: could not read data");
            //Ru.dump(e);
            return null;
         }
      }
   };
   
   /*
      Function: clear
      Clears the cache
   */
   pub.clear = function() {
      //Ru.info (5, "cache: cleared");
      var parent = Ti.Filesystem.getApplicationDataDirectory();
      var folder = Ti.Filesystem.getFile(parent, 'cache');
      folder.deleteDirectory(true);
      alert('Local device data has been successfully cleared!');
   };
   
   /*
      Function: write
      Writes data to a file_name in the cache directory, resets the mod_date
   
      Parameters:
         file_name   - *string* name of the file to write (should be md5 of a url)
         data        - *string* data to write
   */
   priv.write = function(file_name, data) {
      var parent = Ti.Filesystem.getApplicationDataDirectory();
      var new_folder = Ti.Filesystem.getFile(parent, 'cache');
      new_folder.createDirectory();
   
      var file_data = Ti.Filesystem.getApplicationDataDirectory()+'/cache/'+file_name;
      file_data = Ti.Filesystem.getFile(file_data);
   
      var mod_data = Ti.Filesystem.getApplicationDataDirectory()+'/cache/'+file_name+'.mod';      mod_data = Ti.Filesystem.getFile(mod_data);
   
      var date_current = new Date();
      var dateCurrJSON = {date:date_current.toString()};
   
      file_data.write(data);
      mod_data.write(JSON.stringify(dateCurrJSON));
   
      return;
   };

   /*
      Function: setModDate
      Sets the mod date of a file

      Parameters:
         file_name   - *string* file name to set mod date for, should
                       be md5 of some url
         date        - *Date* date to set
   */
   priv.setModDate = function(file_name, date) {
      var mod_data = Ti.Filesystem.getApplicationDataDirectory() + 
         '/cache/' + file_name + '.mod';
      mod_data = Ti.Filesystem.getFile(mod_data);
      var date_current = date;

      var dateCurrJSON = { date : date_current.toString() };
      mod_data.write(JSON.stringify(dateCurrJSON));
   
      return;
   };
   
   /*
      Function: del
      Deletes the cache of a given url, used when there's a parse error, we don't
      wan't to cache invalid data!
   
      Parameters:
         url      - *string* url to delete cache of
   */
   pub.del = function (url) {
      if (typeof url !== "string") {
         //Ru.info (5, "cache: invalid input");
         return false;
      }
      //Ru.info (5, 'cache: deleting ' + url);
      var file_name = Ti.Utils.md5HexDigest (url);
      var mod_data = Ti.Filesystem.getApplicationDataDirectory()+'/cache/'+file_name+'.mod';
      mod_data = Ti.Filesystem.getFile(mod_data);
      var file = Ti.Filesystem.getApplicationDataDirectory()+'/cache/'+file_name;
      file = Ti.Filesystem.getFile(file);
      file.deleteFile();
      mod_data.deleteFile();
      return true;
   };
   
   /*
      Function: modDate
      Retrieves the modification date of a file
   
      Parameters:
         file_name   - *string* name of the file to check (should be md5 of a url)
      
      Returns:
         *date* A javascript date object
   */
   priv.modDate = function(file_name) {
      var d, t;
      var mod_data = Ti.Filesystem.getApplicationDataDirectory()+'/cache/'+file_name+'.mod';
      mod_data = Ti.Filesystem.getFile(mod_data);
   
      // don't know why this is happening ....
      if (typeof mod_data.exists !== "function") {
         return false; 
      }
      if (mod_data.exists() === false) {
         return false;
      } else {
         try {
            t = JSON.parse(mod_data.read().toString()).date;
            d = new Date (t);
         } catch (e) { 
            d = new Date();
         }
         return d;
      }
   };
   
   /*
      Function: check
      Checks a given file_name with a given offset to see if the cached data
      is too old.  If the data is too old, sends out an HTTP HEAD request
      to respect the Last-Modified header.
   
      Parameters:
         file_name   - *string* name of the file to check (should be md5 of a url)
         offset      - *number* number of hours the cache should be valid for
         url         - *string* url to send http HEAD to
         callback    - *function* callback function
 _ 
      Returns:
         calls callback(*int* cache check constant)
   
      See Also:
         <Cache check return values>
   */
   priv.check = function (file_name, offset, url, callback) {
      var file_date = priv.modDate(file_name), lastmod_date;
      var offset_date = new Date();
      offset_date.setHours(offset_date.getHours()-offset);
   
      if (file_date === false) {
         callback(Network.CACHE_CHECK_NONE);
      } else if (file_date < offset_date) {
         // http head the url
         // if its older than date, don't bother to re grab. return usable
         // if its newer tahn date, return cache ck old
         if (url !== undefined) {
            var xhr = Ti.Network.createHTTPClient({ url: url });
            xhr.onload = function (e) {
               try {
                  lastmod_date = new Date(e.source.getResponseHeader('Last-Modified'));
               } catch (e) {
                  //Ru.dump(e);
                  callback(Network.CACHE_CHECK_OLD);
                  return;
               }
               if (file_date > lastmod_date) {
                  //Ru.info(5, "cache: http head says our file has not been modified recently");
                  priv.setModDate(lastmod_date);
                  callback(Network.CACHE_CHECK_USABLE);
               } else {
                  //Ru.info(5, "cache: respecting http last mod header, cache is old");
                  callback(Network.CACHE_CHECK_OLD); 
               }
            };
            xhr.onerror = function (e) {
               callback(Network.CACHE_CHECK_OLD);
            };
            xhr.open("HEAD", url);
            xhr.timeout = 1000;
            xhr.send();
         }
      } else {
         callback(Network.CACHE_CHECK_USABLE);
      }
   };
   
   return pub;
}());
