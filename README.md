# CompressImage
为客户节省流量,前端实现图片压缩功能，支持自定义压缩最大尺寸，支持多图压缩，支持进度获取。
<br/>
<br/>

## 使用

<br/>

### 1.取得input file

```javascript
document.querySelector('input[type="file"').onchange=fun;
```

### 2.新建CompressImage对象，设置配置参数

```javascript
function fun(){
    var ci=new CompressImage({
      files:this.files,
      outConfig:{
        isAutoName:false,
        limit_size:1*1024*100
      },
      done:function(files,err){
        if(err)
        {
          console.error(err);
          return;
        }
        console.log(files);
        console.log("压缩完成！")
      },
      progress:function(compFile){
        console.info("当前压缩进度为："+(compFile/this.files.length*100).toFixed(2)+"%");
      }
    });
    ci.start();
  }
```
<br/>

### Config 配置参数说明

<br/>

#### files

源图片列表，由input file取得。

#### outConfig

输出配置：
<br/>
<br/>
isAutoName 表示是否启用自动命名，默认为false，不启用，启用时以当前时间戳自动命名压缩后的图片文件。
<br/>
<br/>
limit_size 表示限制压缩的最大尺寸，单位为字节，设置该参数后，图片会压缩直到小于该尺寸或达到最大压缩率为止。
<br/>
<br/>
done  完成的回调函数，当压缩完成后会回调该函数，参数files为压缩后的图片数组，err为错误提示string，如果存在错误，err有值，否则为undefined。
<br/>
<br/>

#### progress

完成进度的回调，参数comFile表示已完成压缩的文件数目。
