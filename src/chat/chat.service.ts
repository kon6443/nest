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

    manipulateObjectToList(users, limit) {
        let userCount = users[0].order ? users.length : 0;
        let header = `[${users[0].id}] ${users[0].title} (${userCount}/${limit})\n`;
        let body = header;
        for(let i=0;i<limit;i++) {
            if(users[0] && users[0].order!==null && users[0].order===i+1) {
                body = body.concat(`${i+1}. ${users[0].userId}\n`);
                users.splice(0, 1);
            } else {
                body = body.concat(`${i+1}.\n`);
            }
        }
        return { header, body };
    }

    async getAllList() {
        let lists = '<명단 리스트>\n';
        let sql = `SELECT Parties.id, Parties.title, Parties.limit, PartyMembers.order, PartyMembers.userId FROM Parties LEFT JOIN PartyMembers ON Parties.id = PartyMembers.partyId ORDER BY Parties.id, PartyMembers.order;`;
        let res = await this.repositoryInstance.executeQuery(sql);
        type ListType = { id: number, title: string, limit: number, order: number, userId: number };
        let charts: Map<number, ListType[]> = new Map<number, ListType[]>();
        for(let i=0;i<res.length;i++) {
            let chart: ListType = {
                id: res[i].id,
                title: res[i].title,
                limit: res[i].limit,
                order: res[i].order,
                userId: res[i].userId,
            };
            charts.get(chart.id) ? charts.get(chart.id).push(chart) : charts.set(chart.id, [chart]);
        }
        let accumulated_body = ``;
        for(const [partyId, value] of charts) {
            let limit = charts.get(partyId)[0].limit;
            let users = charts.get(partyId);
            let { header, body } = this.manipulateObjectToList(users, limit);
            lists = lists.concat(header);
            accumulated_body = accumulated_body.concat(body);
        }

        lists = lists.concat('\n━━━━━༻❁༺━━━━━\n');
        lists = lists.concat(accumulated_body);
        return lists;
    }

    async getListById(partyId) {
        const sql = `SELECT Parties.id, Parties.title, Parties.limit, PartyMembers.userId, PartyMembers.order FROM Parties LEFT JOIN PartyMembers ON Parties.id = PartyMembers.partyId WHERE Parties.id = ? ORDER BY PartyMembers.order;`;
        const values = [partyId];
        let res = await this.repositoryInstance.executeQuery(sql, values);
        const { header, body } = this.manipulateObjectToList(res, res[0].limit);
        const list = `━━━━━༻❁༺━━━━━\n` + body;
        return list;
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
        const sql = `INSERT INTO PartyMembers (partyId, \`order\`, userId) VALUES (?,?,?);`;
        const values = [ partyId, order, userId ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.affectedRows===1) {
            return await this.getListById(partyId);
        }
        return `Error:: Something went wrong.`;
    }

    async deleteTeam(partyId) {
        try {
            const sql = `DELETE FROM Parties WHERE id = ?;`;
            const values = [ partyId ];
            const res = await this.repositoryInstance.executeQuery(sql, values);
            if(res.affectedRows===1) {
                return `${partyId}팀을 삭제했습니다.`;
            }
        } catch(err) {
            return err;
        }
    }

    async searchById(userId) {
        try {
            const sql = `SELECT Parties.id, PartyMembers.userId, Parties.title, PartyMembers.order FROM Parties LEFT JOIN PartyMembers ON Parties.id = PartyMembers.id WHERE PartyMembers.userId = ? ORDER BY Parties.id;`;
            const values = [ userId ];
            const res = await this.repositoryInstance.executeQuery(sql, values);
            let list = '<가입된 명단 목록>\n'
            list = list.concat('━━━━━༻❁༺━━━━━\n');
            for(let i=0;i<res.length;i++) {
                list = list.concat(`[${res[i].id}] ${res[i].title}\n`);
                list = list.concat(`${res[i].order}번: ${res[i].userId}\n\n`);
            }
            return list;
        } catch(err) {
            return err;
        }
        return 'search by id';
    }

    async leaveTeam(partyId, order) {
        const sql = `DELETE FROM PartyMembers WHERE partyId = ? AND \`order\` = ?;`;
        const values = [ partyId, order ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.affectedRows===1) {
            let list = `${partyId}팀에서 탈퇴했습니다.\n`;
            const body = await this.getListById(partyId);
            list = list.concat(body);
            return list;
        }
    }

    getTutorial(){
        return `
            • 명단 보기 
            !명단  
            !명단 3팀             

            • 팀 생성하기 (기본값 10명) / 최대인원 설정
            !생성 제목
            // !생성 제목 작성 후 n명
            
            • 특정 아이디가 가입된 팀 검색하기
            !검색 아이디

            • 팀에 가입하기
            !가입 3팀
            !가입 3팀 2번

            • 팀 삭제하기
            !삭제 3팀

            • 팀에서 탈퇴하기
            // !탈퇴 3팀 2번

            • 도움말
            !도움말
        `;
    }

    analyzeCommand(message) {
        // Validate the command.
        const regex = /(!명단|!가입|!생성|!검색|!탈퇴|!수정|!삭제|!도움말)/;
        let cmd = message.substr(0,4).match(regex);
        if(!cmd) {
            return { cmd: this.wrongCommandAlert };
        }
        cmd = cmd[0].substr(1);
        let title = '';
        let partyId;
        let order;
        let limit;
        let userId;

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

        // This switch statement validates if user has provided arguments properly regarding to their request.
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
            case '검색': {
                if(message.length<=4) {
                    return { cmd: this.wrongCommandAlert };
                }
                userId = message.substr(4);
                break;
            }
            case '가입': {
                if(!partyId) {
                    return { cmd: this.wrongCommandAlert};
                }
            }
            case '탈퇴'||'검색': {
                if(!partyId || !order) {
                    return { cmd: this.wrongCommandAlert};
                }
                break;
            }
        }
        return { cmd, title, partyId, order, limit, userId };
    }

    async executeCommand(message, user_id?) {
        const cmdObject = this.analyzeCommand(message);
        switch(cmdObject.cmd) {
            case '명단': {
                if(cmdObject.partyId) {
                    return await this.getListById(cmdObject.partyId);
                }
                return await this.getAllList();
            }
            case '생성': {
                return await this.createTeam(cmdObject.title, cmdObject.limit);
                break;
            }
            case '삭제': {
                return await this.deleteTeam(cmdObject.partyId);
            }
            case '가입': {
                return await this.insertMember(cmdObject.partyId, cmdObject.order, user_id);
                break;
            }
            case '검색': {
                return await this.searchById(cmdObject.userId);
                break;
            }
            case '탈퇴': {
                return await this.leaveTeam(cmdObject.partyId, cmdObject.order);
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
