import { Injectable } from '@nestjs/common';

import { MySQLRepository } from '../shared/mysql.repository';

const COMMAND_PREFIX = '!';
enum Command {
    LIST = '명단',
    CREATE = '생성',
    DELETE = '삭제',
    JOIN = '가입',
    SEARCH = '검색',
    LEAVE = '탈퇴',
    TEACH = '가르치기',
    HELP = '도움말',
}

@Injectable()
export class ChatService {

    private readonly wrongCommandAlert;
    private readonly commandToFunction;

    constructor(private readonly repositoryInstance: MySQLRepository) {
        this.wrongCommandAlert = `잘못된 명령어 입니다. '!도움말' 명령어로 도움말을 확인해 주세요.`;
        this.commandToFunction = {
            [Command.LIST]: async (cmdObject) => {
                return cmdObject.partyId ? await this.getListById(cmdObject.partyId) : await this.getAllList();
            },
            [Command.CREATE]: async (cmdObject) => await this.createTeam(cmdObject.title, cmdObject.limit),
            [Command.DELETE]: async (cmdObject) => await this.deleteTeam(cmdObject.partyId),
            [Command.SEARCH]: async (cmdObject) => await this.searchById(cmdObject.userId),
            [Command.JOIN]: async (cmdObject) => await this.insertMember(cmdObject.partyId, cmdObject.order, cmdObject.userId),
            [Command.LEAVE]: async (cmdObject) => await this.leaveTeam(cmdObject.partyId, cmdObject.order),
            [Command.HELP]: () => this.getTutorial(),
        }
    }

    private unknownCommand(cmdObject) {
        return cmdObject.cmd;
    }

    isCommand(message) {
        return message.startsWith(COMMAND_PREFIX);
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
        // Fetch all lists from the DB.
        let sql = `SELECT Parties.id, Parties.title, Parties.limit, PartyMembers.order, PartyMembers.userId FROM Parties LEFT JOIN PartyMembers ON Parties.id = PartyMembers.partyId ORDER BY Parties.id, PartyMembers.order;`;
        let res = await this.repositoryInstance.executeQuery(sql);

        // Fetched data from M:N table store into a map with the same team.
        type PartyType = { id: number, title: string, limit: number, order: number, userId: number };
        let parties: Map<number, PartyType[]> = new Map<number, PartyType[]>();
        for(let i=0;i<res.length;i++) {
            let party: PartyType = {
                id: res[i].id,
                title: res[i].title,
                limit: res[i].limit,
                order: res[i].order,
                userId: res[i].userId,
            };
            parties.get(party.id) ? parties.get(party.id).push(party) : parties.set(party.id, [party]);
        }

        // Making an entire party list.
        let lists = '<명단 리스트>\n';
        let accumulated_body = ``;
        for(const [partyId, value] of parties) {
            let limit = parties.get(partyId)[0].limit;
            let users = parties.get(partyId);
            let { header, body } = this.manipulateObjectToList(users, limit);
            lists = lists.concat(header);
            accumulated_body = accumulated_body.concat(body+'\n');
        }
        lists = lists.concat('\n━━━━━༻❁༺━━━━━\n\n');
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

    private async createTeam(title, limit?) {
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
            const sql = `SELECT PartyMembers.userId, PartyMembers.order, PartyMembers.partyId, Parties.title FROM PartyMembers LEFT JOIN Parties ON PartyMembers.partyId = Parties.id WHERE PartyMembers.userId = ? ORDER BY PartyMembers.partyId;`;
            const values = [ userId ];
            const res = await this.repositoryInstance.executeQuery(sql, values);
            let list = '<가입된 명단 목록>\n'
            list = list.concat('━━━━━༻❁༺━━━━━\n');
            for(let i=0;i<res.length;i++) {
                list = list.concat(`[${res[i].partyId}] ${res[i].title}\n`);
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
        return `• 명단 보기 
!명단  
!명단 3팀             

• 팀 생성하기 (기본값 10명) / 최대인원 설정
!생성 제목
// !생성 제목 작성 후 n명
        
• 특정 아이디가 가입된 팀 검색하기
!검색 아이디

• 팀에 가입하기
// !가입 3팀
!가입 3팀 2번

• 팀 삭제하기
!삭제 3팀

• 팀에서 탈퇴하기
!탈퇴 3팀 2번

• 도움말
!도움말`;
    }

    analyzeCommand(message, userId?) {
        // Validate the command.
        const commandRegex = new RegExp(`(${Object.values(Command).join('|')})`);
        let cmd = message.substr(1,4).match(commandRegex);
        if(!cmd) {
            return { cmd: this.wrongCommandAlert };
        }
        cmd = cmd[1];

        const teamPattern = /([0-9]+)팀/;
        const teamMatch = message.match(teamPattern);
        const partyId = teamMatch ? teamMatch[1] : null;

        const orderPattern = /([0-9]+)번/;
        const orderMatch = message.match(orderPattern);
        const order = orderMatch ? orderMatch[1] : null;

        let title = '';
        let limit = null;

        // This switch statement validates if user has provided arguments properly regarding to their request.
        switch(cmd) {
            case Command.CREATE: {
                // Find digits at the end.
                const limitPattern = /최대인원설정:\s*\d+명$/;
                const limitMatch = message.match(limitPattern);
                if(limitMatch) {
                    limit = parseInt(limitMatch[1],10);
                    title = message.replace(limitPattern, '').trim().substr(4);
                } else {
                    title = message.substr(4);
                }
                break;
            }
            case Command.SEARCH: {
                if(message.length<=4) {
                    return { cmd: this.wrongCommandAlert };
                }
                userId = message.substr(4);
                break;
            }
            case Command.JOIN: {
                if(!partyId) {
                    return { cmd: this.wrongCommandAlert};
                }
                break;
            }
            case Command.LEAVE: {
                if(!partyId || !order) {
                    return { cmd: this.wrongCommandAlert};
                }
                break;
            }
        }
        return { cmd, title, partyId, order, limit, userId };
    }

    async executeCommand(message, userId?) {
        const cmdObject = this.analyzeCommand(message, userId);
        const selectedFunction = this.commandToFunction[cmdObject.cmd] || this.unknownCommand;

        return await selectedFunction(cmdObject); // Call the returned function here.
    }

    /*
    async executeCommand2(message, user_id?) {
        const cmdObject = this.analyzeCommand(message);
        switch(cmdObject.cmd) {
            case COMMANDS.LIST: {
                return cmdObject.partyId ? await this.getListById(cmdObject.partyId) : await this.getAllList();
            }
            case COMMANDS.CREATE: {
                return await this.createTeam(cmdObject.title, cmdObject.limit);
            }
            case COMMANDS.DELETE: {
                return await this.deleteTeam(cmdObject.partyId);
            }
            case COMMANDS.JOIN: {
                return await this.insertMember(cmdObject.partyId, cmdObject.order, user_id);
            }
            case COMMANDS.SEARCH: {
                return await this.searchById(cmdObject.userId);
            }
            case COMMANDS.LEAVE: {
                return await this.leaveTeam(cmdObject.partyId, cmdObject.order);
            }
            case COMMANDS.HELP: {
                return this.getTutorial();
            }
            default: 
                return cmdObject.cmd;
        }
    }
    */

}
