import tls from 'node:tls';

type Reply={code:number;text:string};

class ReplyReader{
  private buffer='';
  private pending:Reply[]=[];
  private waiters:Array<(reply:Reply)=>void>=[];
  private currentCode='';
  private currentLines:string[]=[];

  constructor(private socket:tls.TLSSocket){
    socket.on('data',chunk=>{this.buffer+=chunk.toString('utf8');this.parse()});
  }

  private parse(){
    while(true){
      const i=this.buffer.indexOf('\r\n');
      if(i<0)return;
      const line=this.buffer.slice(0,i);
      this.buffer=this.buffer.slice(i+2);
      const m=line.match(/^(\d{3})([- ])(.*)$/);
      if(!m)continue;
      if(!this.currentCode)this.currentCode=m[1];
      this.currentLines.push(line);
      if(m[2]===' '){
        const reply={code:Number(m[1]),text:this.currentLines.join('\n')};
        this.currentCode='';this.currentLines=[];
        const waiter=this.waiters.shift();
        if(waiter)waiter(reply);else this.pending.push(reply);
      }
    }
  }

  next(timeoutMs=15000):Promise<Reply>{
    const ready=this.pending.shift();
    if(ready)return Promise.resolve(ready);
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('GMAIL_SMTP_TIMEOUT')),timeoutMs);
      this.waiters.push(reply=>{clearTimeout(timer);resolve(reply)});
    });
  }
}

function expect(reply:Reply,codes:number[]){
  if(!codes.includes(reply.code))throw new Error('GMAIL_SMTP_'+reply.code+': '+reply.text);
}

function b64(value:string){return Buffer.from(value,'utf8').toString('base64')}
function encodeSubject(value:string){return '=?UTF-8?B?'+b64(value)+'?='}
function wrapBase64(value:string){return value.match(/.{1,76}/g)?.join('\r\n')||''}

function message(input:{from:string;to:string;subject:string;html:string}){
  const body=wrapBase64(b64(input.html));
  const lines=[
    'From: KEKS Akademi <'+input.from+'>',
    'To: <'+input.to+'>',
    'Reply-To: <'+input.from+'>',
    'Subject: '+encodeSubject(input.subject),
    'Date: '+new Date().toUTCString(),
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body
  ];
  return lines.join('\r\n').replace(/^\./gm,'..');
}

export async function sendGmailSmtp(input:{username:string;appPassword:string;to:string;subject:string;html:string}){
  const socket=tls.connect({
    host:'smtp.gmail.com',
    port:465,
    servername:'smtp.gmail.com',
    rejectUnauthorized:true
  });
  socket.setTimeout(20000);
  const reader=new ReplyReader(socket);

  await new Promise<void>((resolve,reject)=>{
    socket.once('secureConnect',()=>resolve());
    socket.once('error',reject);
    socket.once('timeout',()=>reject(new Error('GMAIL_SMTP_TIMEOUT')));
  });

  try{
    expect(await reader.next(),[220]);
    socket.write('EHLO keksakademi.vercel.app\r\n');expect(await reader.next(),[250]);
    socket.write('AUTH LOGIN\r\n');expect(await reader.next(),[334]);
    socket.write(b64(input.username)+'\r\n');expect(await reader.next(),[334]);
    socket.write(b64(input.appPassword.replace(/\s+/g,''))+'\r\n');expect(await reader.next(),[235]);
    socket.write('MAIL FROM:<'+input.username+'>\r\n');expect(await reader.next(),[250]);
    socket.write('RCPT TO:<'+input.to+'>\r\n');expect(await reader.next(),[250,251]);
    socket.write('DATA\r\n');expect(await reader.next(),[354]);
    socket.write(message({from:input.username,to:input.to,subject:input.subject,html:input.html})+'\r\n.\r\n');
    expect(await reader.next(),[250]);
    socket.write('QUIT\r\n');
    try{await reader.next(3000)}catch{}
    return {provider:'gmail-smtp',from:input.username,to:input.to};
  }finally{
    socket.end();
  }
}
