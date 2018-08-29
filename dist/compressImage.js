/*
		 * ob object
		 * {
		 * 	files:[], 文件列表 	required
		 * 	outConfig:{
		 * 		isAutoName:false,	启用自动命名
		 * 		limit_size:1*1024*1024		限制压缩最大尺寸，单位为字节
		 * 	},
		 * 	done:function(files,error){}	完成回调，files压缩后的图片文件列表，error错误消息  required
		 * 	progress:function(completeNum){}	进度回调，completeNum当前已完成压缩的文件数目
		 * }
		 */
		function CompressImage(ob){
			this.files=ob.files;
			this.config={
				isAutoName:false,				//是否启用自动命名，默认以当前时间戳命名
				quality:1,						//起始输出图片质量，默认从1开始递减,每次递减0.05，直到压缩到限定尺寸范围或达到最小压缩率为止。
				limit_size:1*1024*1024			//默认限制压缩输出图片1MB以内
			};
			this.callBack=ob.done;
			this.progress=ob.progress;
			this.outFiles=[];
			this.error=undefined;
			
			var me=this;
			
			this.start=function(){
				if(typeof this.callBack!=="function"){
					console.error("the callback function of done cannot be null or "+typeof(this.callBack)+"!");
					return;
				}
				if(!window.FileReader)
				{
					this.error="the brower cannot support window.FileReader!";
					this.callBack(this.outFiles,this.error);
					return;
				}
				if(!document.createElement('canvas').getContext)
				{
					this.error="the brower cannot support the canvas of html5!";
					this.callBack(this.outFiles,this.error);
					return;
				}
				if(!this.files){
					this.error="the source image cannot be null!";
					this.callBack(this.outFiles,this.error);
					return;
				}
				if(ob.outConfig)
				{
					Object.assign(this.config,ob.outConfig);
				}
				for(var i=0;i<this.files.length;i++)
				{
					this.config.type=this.files[i].type;
					this.fileToURL(this.files[i],this.files[i].name);
				};
			}
			this.dataURLtoFile=function(dataurl, filename) {//将base64转换为文件
			    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
			    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
			    while(n--){
			        u8arr[n] = bstr.charCodeAt(n);
			    }
			    return new File([u8arr], filename, {type:mime});
			}
			
			this.canvasToFile=function(img,filename){
				var canvas=document.createElement('canvas');
				canvas.width=img.width;
				canvas.height=img.height;
				var ctx=canvas.getContext('2d');
				ctx.drawImage(img,0,0,canvas.width,canvas.height);
				if(this.config.isAutoName)
				{
					filename=Date.now().toString();
				}
				var result={};
				result=this.dataURLtoFile(canvas.toDataURL(this.config.type,0),filename);
				if(result.size<this.config.limit_size){
					result=this.dataURLtoFile(canvas.toDataURL(this.config.type,this.config.quality),filename);
					while(result.size>this.config.limit_size && this.config.quality >0 ){
						this.config.quality= parseFloat((this.config.quality-0.05).toFixed(2));	
						result=this.dataURLtoFile(canvas.toDataURL(this.config.type,this.config.quality),filename);
					}
				}
				this.outFiles.push(result);
				this.config.quality=1;
				if(typeof this.progress === 'function')
				{
					this.progress(this.outFiles.length);
				}
				if(this.outFiles.length===this.files.length)
				{
					this.callBack(this.outFiles);
				}
			}
			
			this.urlToImg=function(dataUrl,filename){
				var img=new Image();
				img.src=dataUrl;
				img.onload=function(){
					me.canvasToFile(img,filename);	
				};
			}
			
			this.fileToURL=function(fileOb,filename){
				var reader=new FileReader();
				reader.readAsDataURL(fileOb);
				reader.onload=function(){;
					me.urlToImg(reader.result,filename);	
				};
			}
			
		}