import {describe,expect,it} from 'vitest';
import {GET} from './route';

describe('PWA brand PNG endpoint',()=>{
  for(const size of [192,512]){
    it('returns a real '+size+'px PNG, not an HTML or image pipeline error',async()=>{
      const response=await GET(new Request('http://localhost/api/public/brand-icon?size='+size));
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('image/png');
      const data=new Uint8Array(await response.arrayBuffer());
      expect([...data.slice(0,8)]).toEqual([137,80,78,71,13,10,26,10]);
      const view=new DataView(data.buffer);
      expect(view.getUint32(16)).toBe(size);
      expect(view.getUint32(20)).toBe(size);
    });
  }
});
