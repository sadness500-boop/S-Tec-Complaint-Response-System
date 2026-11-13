import base64, json, re, sys
R='/home/claude/cr/'
def b64(p): return base64.b64encode(open(R+p,'rb').read()).decode()
assets={'logo':'data:image/png;base64,'+b64('assets/logo.png'),'cube':'data:image/jpeg;base64,'+b64('assets/cube.jpg'),
 'sanitec':'data:image/png;base64,'+b64('assets/sanitec.png'),'headerTbc':'data:image/png;base64,'+b64('assets/header-tbc.png'),
 'sigBase':'data:image/png;base64,'+b64('assets/sig-base.png'),'dancing':b64('assets/dancing-script-latin-400-normal.woff2'),'icon':'data:image/png;base64,'+b64('assets/icon.png'),'voc':'data:image/png;base64,'+b64('assets/voc-icon-420.png')}
import glob, os
from PIL import Image
assets['fig']={os.path.basename(f)[:-4]:'data:image/jpeg;base64,'+b64(f.replace(R,'')) for f in sorted(glob.glob(R+'assets/fig/*.jpg'))}
assets['figDim']={os.path.basename(f)[:-4]:list(Image.open(f).size) for f in sorted(glob.glob(R+'assets/fig/*.jpg'))}
assets['poster']={os.path.basename(f)[:-4]:'data:image/jpeg;base64,'+b64(f.replace(R,'')) for f in sorted(glob.glob(R+'media/posters/*.jpg'))}
libs=['node_modules/jszip/dist/jszip.min.js','lib/docx.min.js','lib/pptx.min.js','node_modules/jspdf/dist/jspdf.umd.min.js','node_modules/html2canvas/dist/html2canvas.min.js']
def scr(s): return s.replace('</script','<\\/script')
html=open(R+'src/index.html',encoding='utf-8').read()
libtags=''.join('<script>'+scr(open(R+l,encoding='utf-8').read())+'</script>\n' for l in libs)
# jszip: pptxgen bundle exposes JSZip globally
html=html.replace('<!--LIBS-->',libtags)
html=html.replace('<!--QR-->','<script>'+scr(open(R+'node_modules/qrcode-generator/dist/qrcode.js',encoding='utf-8').read())+'</script>')
html=html.replace('/*SITES*/',scr(open(R+'src/sites.js',encoding='utf-8').read()))
html=html.replace('/*UI*/',scr(open(R+'src/ui.js',encoding='utf-8').read()))
html=html.replace('<!--AUTHCSS-->',open(R+'lib/auth.css',encoding='utf-8').read())
html=html.replace('/*SUPABASE*/',scr(open(R+'lib/supabase.js',encoding='utf-8').read()))
html=html.replace('/*WORKER*/',scr(open(R+'src/worker.js',encoding='utf-8').read()))
html=html.replace('/*APPACCESS*/',scr(open(R+'src/app-access.js',encoding='utf-8').read()))
html=html.replace('/*AUTH*/',scr(open(R+'lib/auth.js',encoding='utf-8').read()))
html=html.replace('/*ASSETS*/','const ASSET='+json.dumps(assets)+';')
html=html.replace('/*HF*/',scr(open(R+'src/hf.js',encoding='utf-8').read()))
html=html.replace('/*KB*/',scr(open(R+'src/kb.js',encoding='utf-8').read()))
html=html.replace('/*APP*/',scr(open(R+'src/app.js',encoding='utf-8').read()))
out=sys.argv[1] if len(sys.argv)>1 else R+'dist/S-Tec-Complaint-Response-System_v1.3.0.html'
import os; os.makedirs(os.path.dirname(out),exist_ok=True)
open(out,'w',encoding='utf-8').write(html); print(out, len(html)//1024,'KB')
