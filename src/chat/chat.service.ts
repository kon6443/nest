import { Injectable } from '@nestjs/common';

import { MySQLRepository } from '../shared/mysql.repository';

@Injectable()
export class ChatService {

    private readonly wrongCommandAlert;

    constructor(private readonly repositoryInstance: MySQLRepository) {
        this.wrongCommandAlert = `잘못된 명령어 입니다. '도움말'을 확인해 주세요.`;
    }

    isCommand(message) {
        if(message[0]==='!') {
            return true;
        }
        return false;
    }

    getHeader(o) {
        return `[${o.id}] ${o.title} (n/${o.limit})\n`;
    }

    /*
    getBody(o) {
        let s = '';
        for(let i=1;i<=10;i++) {
            if() {
            }
            s = s.concat(`${i}. ${o.id}`);
        }
    }
    */

    // getAllList = async (): Promise<string> => {
    async getAllList() {
        let s = '<명단 리스트>\n';
        let sql = `SELECT Parties.id, Parties.title, Parties.limit, PartyMembers.order, PartyMembers.userId FROM Parties LEFT JOIN PartyMembers ON Parties.id = PartyMembers.partyId ORDER BY Parties.id, PartyMembers.order;`;
        let res = await this.repositoryInstance.executeQuery(sql);
        type List = { id: number, title: string, limit: number, order: number, userId: number };
        let charts: Map<number, List[]> = new Map<number, List[]>();
        for(let i=0;i<res.length;i++) {
            let chart: List = {
                id: res[i].id,
                title: res[i].title,
                limit: res[i].limit,
                order: res[i].order,
                userId: res[i].userId,
            };

            // charts[chart.id] = charts[chart.id] ?? [];
            // charts[chart.id].push(chart);
            
            charts.get(chart.id) ? charts.get(chart.id).push(chart) : charts.set(chart.id, [chart]);

        }


        console.log('charts:', charts);
        for(const [ partyId, value ] of charts) {
            let limit = charts.get(partyId)[0].limit;
            let team = charts.get(partyId);
            s = s.concat(`[${team[0].id}] ${team[0].title}   (${team.length}/${limit})\n`);
            for(let i=0;i<limit;i++) {
                /*
                if(team[i].order!==(undefined||null)) {
                    console.log(i,':', team[i]);
                    s = s.concat(`${i+1}. ${team[i].userId}\n`);
                } else {
                    s = s.concat(`${i+1}. \n`);
                }
                */

                if(team[i].order==i+1) {
                    s = s.concat(`${i+1}. ${team[i].userId}\n`);
                } else {
                    s = s.concat(`${i+1}. \n`);
                }

            }
            s = s.concat(`\n`);
        }

        s = s.concat('\n━━━━━༻❁༺━━━━━\n');
        console.log(s);
        return s;
    }

    async getList(partyId) {
        const sql = ``;
        let list = await this.repositoryInstance.executeQuery(sql);
    }

    async createTeam(title, limit?) {
        try {
            let sql = `INSERT INTO Parties (id, title) VALUES ((SELECT MIN(p1.id+1) FROM Parties p1 LEFT JOIN Parties p2 ON p1.id+1 = p2.id WHERE p2.id IS NULL), ?);`;
            let time = '';
            let values = [title];
            const res = await this.repositoryInstance.executeQuery(sql, values);
            if(res.affectedRows===1) {
                sql = `SELECT id, \`limit\` FROM Parties where title = ?;`;
                values = [title];
                const [ res ] = await this.repositoryInstance.executeQuery(sql, values);
                return `[${res.id}] ${title}이(가) 최대 인원 ${res.limit} 으로 생성 됐어요!`;
            }
            return res;
        } catch(err) {
            return err;
        }
    }

    async insertMember(partyId, order, userId) {
        const sql = `INSERT INTO PartyMembers (partyId, order, userId) VALUES (?,?,?);`;
        const values = [ partyId, order, userId ];
    }

    async deleteTeam(partyId) {
        try {
            const sql = `DELETE FROM Parties WHERE id = ?;`;
            const values = [ partyId ];
            const res = this.repositoryInstance.executeQuery(sql, values);
            console.log('res:', res);
        } catch(err) {
            return err;
        }
    }

    async leaveTeam(partyId) {
        try {
            const sql = `DELETE FROM Parties WHERE id = ?;`;
            const values = [ partyId ];
            const res = this.repositoryInstance.executeQuery(sql, values);
        } catch(err) {
            return err;
        }
    }

    async searchById(userId) {
        return 'search by id';
    }

    getTutorial(){
        return `
            • 명단 보기 
            !명단  
            !명단 3팀 // not yet
            
            • 팀 생성하기 (기본값 10명) / 최대인원 설정
            !생성 제목
            // !생성 제목 작성 후 n명
            
            • 특정 아이디가 가입된 팀 검색하기
            !검색 아이디

            • 팀에 가입하기
            !3팀
            !3팀 2번

            • 팀 삭제하기
            //!삭제 3팀

            • 팀에서 탈퇴하기
            // !탈퇴 3팀 2번

            • 도움말
            !도움말
        `;
    }

    analyzeCommand(message) {
        // Validate the command.
        const regex = /(!명단|!생성|!검색|!수정|!삭제|!도움말)/;
        let cmd = message.substr(0,4).match(regex);
        if(!cmd) {
            return { cmd: this.wrongCommandAlert };
        }
        cmd = cmd[0].substr(1);
        let title = '';
        let partyId;
        let order;
        let limit;

        let teamPattern = /([0-9]+)팀/;
        let teamMatch = message.match(teamPattern);
        if(teamMatch) {
            partyId = teamMatch[1];
        }

        let orderPattern = /([0-9]+)번/;
        let orderMatch = message.match(orderPattern);
        if(orderMatch) {
            order = orderMatch[1];
        }

        switch(cmd) {
            case '생성': {
                const length = message.length;
                if(length<=4) {
                    return { cmd: this.wrongCommandAlert};
                }
                // Find digits at the end.
                let limitPattern = /최대인원설정:\s*\d+명$/;
                const match = message.match(limitPattern);
                if(match) {
                    limit = match[1];
                    title = message.substr(4, length-4-match[0].length-1);
                } else {
                    title = message.substr(4);
                }
                break;
            }
            case '탈퇴'||'검색': {
                if(!partyId || !order) {
                    return { cmd: this.wrongCommandAlert};
                }
                break;
            }
        }
        return { cmd, title, partyId, order, limit };
    }

    async executeCommand(message, user_id?) {
        const cmdObject = this.analyzeCommand(message);
        console.log('cmdObject:', cmdObject);
        switch(cmdObject.cmd) {
            case '명단': {
                // need to keep working...
                if(cmdObject.partyId) {
                    return this.getList(cmdObject.partyId);
                }
                return await this.getAllList();
            }
            case '생성': {
                return await this.createTeam(cmdObject.title, cmdObject.limit);
                break;
            }
            case '삭제': {
                return await this.leaveTeam(cmdObject.partyId);
            }
            case '등록': {
                return await this.insertMember(cmdObject.partyId, cmdObject.order, user_id);
                break;
            }
            case '검색': {
                break;
            }
            case '탈퇴': {
                break;
            }
            case '도움말': {
                return this.getTutorial();
            }
            default: {
                return cmdObject.cmd;
            }
        }
    }

}
