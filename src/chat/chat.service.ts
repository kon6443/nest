import { Injectable } from '@nestjs/common';

import { MySQLRepository } from '../shared/mysql.repository';

@Injectable()
export class ChatService {

    constructor(private readonly repositoryInstance: MySQLRepository) {}

    isCommand(message) {
        if(message[0]==='!') {
            return true;
        }
        return false;
    }

    getHeader(o) {
        return `[${o.id}] ${o.title} (n/${o.limit})\n`;
    }

    // getAllList = async (): Promise<string> => {
    async getAllList() {
        const sql = `SELECT * FROM PARTIES;`;
        let list = await this.repositoryInstance.executeQuery(sql);
        // list = this.organizeList(list);
        // JSON.stringify(list);
        let s = '';
        for(let i=0;i<list.length;i++) {
            s = s.concat(this.getHeader(list[i]));
        }
        console.log(s);
        return s;
    }

    async getList(partyId) {
        const sql = ``;
        let list = await this.repositoryInstance.executeQuery(sql);
    }

    async createTeam(title, limit?) {
        try {
            console.log('create team title:', title);
            const sql = `INSERT INTO Parties (id, title) VALUES ((SELECT MIN(p1.id+1) FROM Parties p1 LEFT JOIN Parties p2 ON p1.id+1 = p2.id WHERE p2.id IS NULL), ?) RETURNING id;`;
            let time = '';
            const values = [title];
            const res = await this.repositoryInstance.executeQuery(sql, values);
            console.log('res:', res);
            if(res.affectedRows===1) {
                return `${title}이(가) 생성 됐어요!`;
            }
            return res;
        } catch(err) {
            return err;
        }
    }

    async insertMember(partyId, order, userId) {
        console.log('insert a member');
        const sql = `INSERT INTO PartyMembers (partyId, order, userId) VALUES (?,?,?);`;
        const values = [ partyId, order, userId ];
    }

    async leaveTeam(partyId, order) {
        return 'leave team';
    }

    async searchById(userId) {
        return 'search by id';
    }

    getTutorial(){
        return `
            • 전체 명단 보기 
            !명단 
            
            • 팀 생성 
            !생성 팀_이름

            • 팀 탈퇴
            !탈퇴 팀_번호 멤버_번호

            • 등록된 팀 검색
            !검색
        `;
    }

    analyzeCommand(message) {
        const regex = /(명단|생성|검색|수정|삭제|도움말)/;
        let cmd = message.match(regex);
        if(!cmd) {
            return { cmd: `잘못된 명령어 입니다, '도움말'을 확인해 주세요.`};
        }
        cmd = cmd[0];
        let title = '';
        let partyId = '';
        let order;
        let limit;
        switch(cmd) {
            case '명단': {
                // Find digits at the end.
                const pattern = /\s(\d+)$/;
                const match = message.match(pattern);
                if(match) {
                    partyId = match[1];
                }
                break;
            }
            case '생성': {
                const length = message.length;
                if(length<=4) {
                    return { cmd: `잘못된 명령어 입니다, '도움말'을 확인해 주세요.`};
                }
                // Find digits at the end.
                const pattern = /\s(\d+)$/;
                const match = message.match(pattern);
                if(match) {
                    limit = match[1];
                    title = message.substr(4, length-5-match[1].length);
                } else {
                    title = message.substr(4);
                }
                break;
            }
            case '탈퇴'||'검색': {
                const length = message.length;
                if(length<=4) {
                    return { cmd: `잘못된 명령어 입니다, '도움말'을 확인해 주세요.`};
                }
                // Find the first appearance digits
                let pattern = /\d+/;
                let match = message.match(pattern);
                if(match) {
                    partyId = match[0];
                }
                // Find digits at the end.
                pattern = /\s(\d+)$/;
                match = message.match(pattern);
                if(match) {
                    order = match[1];
                }
                break;
            }
        }
        return { cmd, title, partyId, order, limit };
    }

    async executeCommand(message) {
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
            case '등록': {
                return await this.insertMember(cmdObject.partyId, cmdObject.order, 'two');
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
