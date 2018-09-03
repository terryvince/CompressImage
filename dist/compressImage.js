/*
		 * ob object
		 * {
		 * 	files:[], 文件列表 	微信内使用可省略
		 * 	outConfig:{
		 * 		isAutoName:false,	启用自动命名
		 * 		limit_size:1*1024*1024,		限制压缩最大尺寸，单位为字节
		 * 		limit_width:720					//如果图片宽度大于720，等比例缩放到720宽高比尺寸
		 * 	},
		 * 	done:function(files,error){}	完成回调，files压缩后的图片文件列表，error错误消息  required
		 * 	progress:function(completeNum){}	进度回调，completeNum当前已完成压缩的文件数目
		 * }
		 */
		function CompressImage(ob){
			this.files=ob.files||[];
			
			this.config={
				isAutoName:false,				//是否启用自动命名，默认以当前时间戳命名
				quality:1,						//起始输出图片质量，默认从1开始递减,每次递减0.05，直到压缩到限定尺寸范围或达到最小压缩率为止。
				limit_size:1*1024*1024,			//默认限制压缩输出图片1MB以内
				limit_width:720					//如果图片宽度大于720，等比例缩放到720宽高比尺寸
			};
			this.callBack=ob.done;
			this.progress=ob.progress;
			this.outFiles=[];
			this.error=undefined;
			
			var me=this;
			var images={
				localId: []						//微信图片上传localId
			}
			//判断访问终端
			var browser={
			  versions:function(){
			    var u = navigator.userAgent, 
			      app = navigator.appVersion;
			    return {
			      trident: u.indexOf('Trident') > -1, //IE内核
			      presto: u.indexOf('Presto') > -1, //opera内核
			      webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
			      gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1,//火狐内核
			      mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
			      ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
			      android: u.indexOf('Android') > -1 || u.indexOf('Adr') > -1, //android终端
			      iPhone: u.indexOf('iPhone') > -1 , //是否为iPhone或者QQHD浏览器
			      iPad: u.indexOf('iPad') > -1, //是否iPad
			      webApp: u.indexOf('Safari') == -1, //是否web应该程序，没有头部与底部
			      weixin: u.indexOf('MicroMessenger') > -1, //是否微信 （2015-01-22新增）
			      qq: u.match(/\sQQ/i) == " qq" //是否QQ
			    };
			  }(),
			  language:(navigator.browserLanguage || navigator.language).toLowerCase()
			}
			
			this.checkError=function(){
				if(typeof this.callBack!=="function"){
					console.error("the callback function of done cannot be null or "+typeof(this.callBack)+"!");
					return false;
				}
				if(!window.FileReader)
				{
					this.error="the brower cannot support window.FileReader!";
					this.callBack(this.outFiles,this.error);
					return false;
				}
				if(!document.createElement('canvas').getContext)
				{
					this.error="the brower cannot support the canvas of html5!";
					this.callBack(this.outFiles,this.error);
					return false;
				}
				if(!this.files.length===0 && !browser.versions.weixin){
					this.error="the source image cannot be null!";
					this.callBack(this.outFiles,this.error);
					return false;
				}
				return true;
			};
			
			this.start=function(){
				if(!this.checkError())
				{
					return;
				}
				if(ob.outConfig)
				{
					Object.assign(this.config,ob.outConfig);
				}
				if(browser.versions.weixin)
				{
					this.weChatStart();
					return;
				}
				for(var i=0;i<this.files.length;i++)
				{
					(function(i){
						me.fileToURL(me.files[i],function(url){
							me.urlToImg(url,function(img){
								me.canvasToFile(img,me.files[i]);
							})
						});
					})(i);
				};
			}
			
			this.weChatStart=function(){
				if(!window.wx)
				{
					var script=document.createElement('script');
					script.src="//res.wx.qq.com/open/js/jweixin-1.2.0.js";
					document.querySelector('body').appendChild(script);
//					script.onload=function(){
//						console.log(wx);
//					}
					return;
				}
				
			}
			
			this.chooseImage=function(callback){
				var imgLen=images.localId.length;
				wx.chooseImage({
					count:8-imgLen,
					success:function(res){
						if(window.__wxjs_is_wkwebview)
						{
							res.localIds.forEach(function(item,index){
								wx.getLocalImgData({
									localId: item, // 图片的localID
									success: function (res) {
										var localData = res.localData; // localData是图片的base64数据，可以用img标签显示
										localData = localData.replace('jgp', 'jpeg');
										images.localId.push(localData);
										if(typeof callback === 'function' && images.localId.length===res.localIds){
											callback(images.localId);
										}
										me.wechatCompress(images.localId);
									}
								});
							});
							return;
						}
						images.localId=images.localId.concat(res.localIds);
						if(typeof callback === 'function'){
							callback(images.localId);
						}
						me.wechatCompress(images.localId);
					}
				})
			}
			
			this.wechatCompress=function(localIds){
				localIds.forEach(function(item,index){
					(function(data){
						var curFile=me.dataURLtoFile(item,Date.now().toString());
						me.urlToImg(data,function(img){
							me.canvasToFile(img,curFile);
						});
					})(item);
				});
			}
			
			//base64转文件
			this.dataURLtoFile=function(dataurl, filename) {
			    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
			    while(n--){
			        u8arr[n] = bstr.charCodeAt(n);
			    }
			    return new File([u8arr], filename, {type:mime});
			}
			
			//图片绘制到canvas压缩后转为文件			
			this.canvasToFile=function(img,fileOb){
				var canvas=document.createElement('canvas');
				var scale=1;
				if(img.width>this.config.limit_width)
				{
					scale=this.config.limit_width/img.width;
				}
				canvas.width=img.width*scale;
				canvas.height=img.height*scale;
				var ctx=canvas.getContext('2d');
				ctx.drawImage(img,0,0,canvas.width,canvas.height);
				if(this.config.isAutoName)
				{
					fileOb.name=Date.now().toString();
				}
				var result={};
				result=this.dataURLtoFile(canvas.toDataURL(fileOb.type,0),fileOb.name);
				if(result.size<this.config.limit_size){
					result=this.dataURLtoFile(canvas.toDataURL(fileOb.type,this.config.quality),fileOb.name);
					while(result.size>this.config.limit_size && this.config.quality >0 ){
						this.config.quality= parseFloat((this.config.quality-0.05).toFixed(2));	
						result=this.dataURLtoFile(canvas.toDataURL(fileOb.type,this.config.quality),fileOb.name);
//						console.log(result.size/1024+'KB',this.config.quality);
					}
				}
				this.outFiles.push(result);
				this.config.quality=1;
				if(typeof this.progress === 'function')
				{
					this.progress(this.outFiles.length);
				}
				if(this.outFiles.length===this.files.length || this.outFiles.length===images.localId.length)
				{
					this.callBack(this.outFiles);
				}
			}
			
			//base64转图片
			this.urlToImg=function(dataUrl,callback){
				var img=new Image();
				img.src=dataUrl;
				img.onload=function(){
					callback(img);	
				};
			}
			
			//文件转base64url
			this.fileToURL=function(fileOb,callback){
				var reader=new FileReader();
				reader.readAsDataURL(fileOb);
				reader.onload=function(){
					callback(reader.result);	
				};
			}
			
		}