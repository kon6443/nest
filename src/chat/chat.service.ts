import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { MySQLRepository } from '../shared/mysql.repository';

import { AnnouncementDto } from './dto/announcement-dto';

@Injectable()
export class ChatService {

    private readonly COMMAND_PREFIX = {
        '!': '!',
        '/': '/',
    };
    private readonly wrongCommandAlert;
    private readonly commandToFunction;
    private readonly Command = {
        LIST: '명단',
        CREATE: '생성',
        DELETE: '삭제',
        JOIN: '가입',
        SEARCH: '검색',
        LEAVE: '탈퇴',
        TEACH: '학습',
        LESSON_DELETE: '학습삭제',
        LESSON_LIST: '학습목록',
        ANNOUNCEMENT: '공지',
        UPDATE_ANNOUNCEMENT: '공지업뎃', 
        HELP: '도움말',
    };
    private commandsMaxLength = 0;
    private readonly official_announcement_url = `https://forum.nexon.com/api/v1/board/1211/threads?alias=maplestorym&pageNo=1&paginationType=PAGING&pageSize=15&blockSize=5&_=1690967856061`;
    private readonly board_path = `https://forum.nexon.com/maplestorym/board_view?board=1211&thread=`;
    private rooms: Set<string> = new Set();
    private activeUsers: Map<string, string>

    constructor( 
        private readonly repositoryInstance: MySQLRepository, 
        private readonly httpService: HttpService, 
    ) {
        this.wrongCommandAlert = `잘못된 명령어 입니다. '!도움말' 명령어로 도움말을 확인해 주세요.`;
        this.commandToFunction = {
            [this.Command.LIST]: async (cmdObject) => {
                return cmdObject.partyId ? await this.getListById(cmdObject.partyId) : await this.getAllList();
            },
            [this.Command.CREATE]: async (cmdObject) => await this.createTeam(cmdObject.title, cmdObject.limit),
            [this.Command.DELETE]: async (cmdObject) => await this.deleteTeam(cmdObject.partyId),
            [this.Command.SEARCH]: async (cmdObject) => await this.searchById(cmdObject.userId),
            [this.Command.JOIN]: async (cmdObject) => await this.insertMember(cmdObject.partyId, cmdObject.order, cmdObject.userId),
            [this.Command.LEAVE]: async (cmdObject) => await this.leaveTeam(cmdObject.partyId, cmdObject.order),
            [this.Command.TEACH]: async (cmdObject) => await this.teachLesson(cmdObject.title, cmdObject.lesson),
            [this.Command.LESSON_DELETE]: async (cmdObject) => await this.deleteLesson(cmdObject.title),
            [this.Command.LESSON_LIST]: async () => await this.getOrganizedTitles(),
            [this.Command.ANNOUNCEMENT]: async () => await this.getAnnouncements(),
            [this.Command.UPDATE_ANNOUNCEMENT]: async () => await this.updateAnnouncements(),
            [this.Command.HELP]: () => this.getHelp(),
        }
        const commands = Object.values(this.Command);
        for(const key in commands) {
            this.commandsMaxLength = Math.max(this.commandsMaxLength, commands[key].length);
        }
    }

    createRoom(roomName) {
        let message = '';
        if(this.rooms.has(roomName)) {
            message = `${roomName} already exists.`;
        } else {
            this.rooms.add(roomName);
            message = `${roomName} has been created.`;
        }
        return message;
    }

    async isRoomValid(roomName) {
        return await !this.rooms.has(roomName) ? true : false;
    }

    getRoomStatus() {
        return this.rooms;
    }

    private unknownCommand(cmdObject) {
        return cmdObject.cmd;
    }

    private isCommand(cursor) {
        return cursor===this.COMMAND_PREFIX[cursor] ? cursor : null;
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

    async getThreadsFromDB(): Promise<AnnouncementDto[]|undefined> {
        try {
            const sql = `SELECT * FROM Announcements ORDER BY threadId DESC;`;
            const threads: AnnouncementDto[]|undefined = await this.repositoryInstance.executeQuery(sql);
            return threads;
        } catch(err) {
            throw new Error(err);
        }
    }

    async getThreadsFromNexon(): Promise<AnnouncementDto[]> {
        try {
            const url = this.official_announcement_url;
            const res = await this.httpService.get(url).toPromise(); 
            const threads: AnnouncementDto[] = res.data.threads.map((thread) => new AnnouncementDto({
                threadId: Number(thread.threadId),
                title: thread.title,
                createDate: Number(thread.createDate), 
                url: this.board_path+thread.threadId,
            }));
            if(res.status===200) {
                return threads;
            }
        } catch(err) {
            throw new Error(err);
        }
    }

    async insertThreadsToDB(threads: AnnouncementDto[]) {
        try {
            const sql = `INSERT INTO Announcements (threadId, title, createDate, url) VALUES ?;`;
            const values = threads.map((thread) => [
                thread.threadId,
                thread.title,
                thread.createDate,
                thread.url,
            ]);
            const res = await this.repositoryInstance.executeQuery(sql, [ values ]);
        } catch(err) {
            throw new Error(err);
        }
    }

    getNewThreads(threadsFromNexon: AnnouncementDto[], threadsFromDB: AnnouncementDto[]): AnnouncementDto[] {
        let newThreads: AnnouncementDto[] = [];
        if(!threadsFromDB.length) 
            return threadsFromNexon;
        for(let i=0;i<threadsFromNexon.length;i++) {
            for(let j=0;j<threadsFromDB.length;j++) {
                if(threadsFromNexon[i].threadId>threadsFromDB[j].threadId) {
                    newThreads.push(threadsFromNexon[i]);
                    break;
                }
                if(threadsFromNexon[i].threadId<=threadsFromDB[j].threadId) return newThreads;
            }
        }
        return newThreads;
    }

    async deleteThreadsFromDB(numberOfExtraThreads) {
        try {
            const sql = `DELETE FROM Announcements ORDER BY threadId LIMIT ?;`;
            const values = [ numberOfExtraThreads ];
            const res = await this.repositoryInstance.executeQuery(sql, values);
        } catch(err) {
            throw new Error(err);
        }
    }

    async updateThreads(): Promise<AnnouncementDto[]> {
        const threadsFromNexon: AnnouncementDto[] = await this.getThreadsFromNexon();
        let threadsFromDB: AnnouncementDto[] = await this.getThreadsFromDB();

        let newThreads: AnnouncementDto[] = this.getNewThreads(threadsFromNexon, threadsFromDB);
        if(newThreads.length) {
            const numberOfExtraThreads = (threadsFromDB.length+newThreads.length) - threadsFromNexon.length;
            if(numberOfExtraThreads) 
                await this.deleteThreadsFromDB(numberOfExtraThreads); 
            await this.insertThreadsToDB(newThreads);
        }
        return newThreads;
    }

    async notifyNewUpdates() {
        const newThreads: AnnouncementDto[] = await this.updateThreads();
        if(newThreads.length===0) {
            return undefined;
        }
        let chatBotMessage = '[신규 공지사항]\n\n';
        for(let i=0;i<newThreads.length;i++) {
            chatBotMessage = chatBotMessage.concat(`━━━━━༻❁༺━━━━━\n${newThreads[i].title}\n [링크]: ${newThreads[i].url}\n\n`);
        }
        return chatBotMessage;
    }

    async updateAnnouncements() {
        const newThreads: AnnouncementDto[] = await this.updateThreads();
        if(newThreads.length) {
            return `공지사항을 업데이트 했어요!`;
        } else {
            return `새로운 공지사항이 없어요!`;
        }
    }

    async getAnnouncements(): Promise<string> {
        try {
            const threads: AnnouncementDto[] = await this.getThreadsFromDB();
            let message = '';
            for(let i=0;i<threads.length;i++) {
                message = message.concat(`[신규 공지사항]\n\n${threads[i].title}\n링크: ${threads[i].url}\n\n`);
            }
            return message;
        } catch(err) {
            throw new Error(err);
        }
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

    // 가입
    async insertMember(partyId, order, userId) {
        const sql = `INSERT INTO PartyMembers (partyId, \`order\`, userId) VALUES (?,?,?);`;
        const values = [ partyId, order, userId ];
        const res = await this.repositoryInstance.executeQuery(sql, values);
        if(res.affectedRows===1) {
            return await this.getListById(partyId);
        }
        return `Error:: Something went wrong.`;
    }

    // 삭제
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

    // 검색
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

    // 탈퇴
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

    async getPreTaughtLessonsByTitle(title) {
        try {
            const sql = `SELECT * FROM Lessons WHERE title = ?;`;
            const values = [ title ];
            const [ res ] = await this.repositoryInstance.executeQuery(sql, values);
            return res.lesson;
        } catch(err) {
            return `학습하지 않은 제목이에요!`;
        }
    }

    // 학습
    async teachLesson(title, lesson) {
        try {
            const sql = `INSERT INTO Lessons (title, lesson) VALUES (?, ?);`;
            const values = [ title, lesson ];
            const res = await this.repositoryInstance.executeQuery(sql, values);
            if(res.affectedRows===1) {
                return `학습 제목${title}을(를) 학습내용 ${lesson} 과(와) 함께 등록했어요!`;
            }
        } catch(err) {
            if(err.code==='ER_DUP_ENTRY' && err.errno===1062) {
                return `이미 학습한 제목이에요!`;
                // throw new Error(`이미 학습한 제목이에요!`);
            }
            return err;
        }
    }

    // 학습목록
    async readAllLessonTitles() {
        try {
            const sql = `SELECT title FROM Lessons;`;
            return await this.repositoryInstance.executeQuery(sql);
        } catch(err) {
            return err;
        }
    }

    // 학습 삭제
    async deleteLesson(title) {
        try {
            const sql = `DELETE FROM Lessons WHERE title = ?;`;
            const values = [ title ];
            const res = await this.repositoryInstance.executeQuery(sql, values);
            if(res.affectedRows===1) {
                return `학습된 ${title}이(가) 삭제 되었습니다!`;
            }
        } catch(err) {
            return err;
        }
    }

    async getOrganizedTitles() {
        const res = await this.readAllLessonTitles();
        let organizedTitles = `현재 챗봇이 학습한 내용이에요!\n`;
        organizedTitles = organizedTitles.concat(`━━━━━༻❁༺━━━━━\n\n`);
        for(let i=0;i<res.length;i++) {
            organizedTitles = organizedTitles.concat(`[${i+1}] ${res[i].title}\n`);
        }
        return organizedTitles;
    }

    getHelp(){
        return `• 명단 보기 
!${this.Command.LIST}  
!${this.Command.LIST} 3팀\n 
• 팀 생성하기 (기본값 10명) / 최대인원 설정
!${this.Command.CREATE} 제목
// !${this.Command.CREATE} 제목 작성 후 n명\n
• 특정 아이디가 가입된 팀 검색하기
!${this.Command.SEARCH} 아이디\n
• 팀에 가입하기
// !${this.Command.JOIN} 3팀
!${this.Command.JOIN} 3팀 2번\n
• 팀 삭제하기
!${this.Command.DELETE} 3팀\n
• 팀에서 탈퇴하기
!${this.Command.LEAVE} 3팀 2번\n
• 학습 시키기
!${this.Command.TEACH} 학습_제목 = 학습할 내용 작성\n
• 학습 삭제하기
!${this.Command.DELETE} 학습_제목\n
• 학습 목록 출력
!${this.Command.LESSON_LIST}\n
• 공식 홈페이지 공지사항 확인
!${this.Command.ANNOUNCEMENT}\n
• 공식 홈페이지 공지사항 업데이트
!${this.Command.UPDATE_ANNOUNCEMENT}\n
• 도움말
!도움말`;
    }

    findExactCommand(message, Command) {
        const commandRegex = new RegExp(`^(${Object.values(Command).join('|')})(?:\\s.*|$)`);
        const match = message.match(commandRegex);
        return match ? match[1] : null
    }

    analyzeCommand(message, userId?) {
        let cmd = this.findExactCommand(message.substr(1,this.commandsMaxLength), this.Command);
        if(!cmd) {
            return { cmd: this.wrongCommandAlert };
        }

        const teamPattern = /([0-9]+)팀/;
        const teamMatch = message.match(teamPattern);
        const partyId = teamMatch ? teamMatch[1] : null;

        const orderPattern = /([0-9]+)번/;
        const orderMatch = message.match(orderPattern);
        const order = orderMatch ? orderMatch[1] : null;

        let title = '';
        let limit = null;
        let lesson = null;

        // This switch statement validates if user has provided arguments properly regarding to their request.
        switch(cmd) {
            case this.Command.CREATE: {
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
            case this.Command.SEARCH: {
                if(message.length<=4) {
                    return { cmd: this.wrongCommandAlert };
                }
                userId = message.substr(4);
                break;
            }
            case this.Command.JOIN: {
                if(!partyId) {
                    return { cmd: this.wrongCommandAlert};
                }
                break;
            }
            case this.Command.LEAVE: {
                if(!partyId || !order) {
                    return { cmd: this.wrongCommandAlert};
                }
                break;
            }
            case this.Command.TEACH: {
                // Pattern that finds title and lesson.
                const pattern = /^([^=\s]+)\s*=\s*(.+)$/;
                const matches = message.substr( this.Command.TEACH.length+2).match(pattern);
                if(!matches) {
                    return { cmd: this.wrongCommandAlert };
                }
                title = matches[1];
                lesson = matches[2];
                break;
            }
            case this.Command.LESSON_DELETE: {
                title = message.substr(6);
                break;
            }
        }
        return { cmd, title, partyId, order, limit, userId, lesson };
    }

    async handleChatCommand(message, userId?) {
        const isCommand = this.isCommand(message.substr(0,1));
        switch(isCommand) {
            case this.COMMAND_PREFIX['!']: {
                // For normal chat bot commands execution.
                const cmdObject = this.analyzeCommand(message, userId);
                const selectedFunction = this.commandToFunction[cmdObject.cmd] || this.unknownCommand;
                return await selectedFunction(cmdObject); // Call the returned function here.
            }
            case this.COMMAND_PREFIX['/']: {
                // For '학습' commands execution.
                return await this.getPreTaughtLessonsByTitle(message.substr(1));
            }
            default: 
                return undefined;
        }
    }

}
