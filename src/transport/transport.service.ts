import { Injectable } from '@nestjs/common';
// HttpService

@Injectable()
export class TransportService {
    
    constructor( 
        // private readonly httpService: HttpService, 
    ) {}

    async requestTransportInfo(keyWord: string) {
        let url = `https://api.gbis.go.kr/ws/rest/busrouteservice/page?serviceKey=1234567890&pageSize=20&pageNo=1&keyword=${keyWord}`;
        const res = '';
        // const res = this.httpService.get(url);
        console.log('res:', res);
        return res;
    }

}
