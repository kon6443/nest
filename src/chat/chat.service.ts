import { Injectable } from '@nestjs/common';

import { MySQLRepository } from '../shared/mysql.repository';

@Injectable()
export class ChatService {

    private readonly execute = new Map<string, (string?) => Promise<any>|string>; 

    constructor(private readonly repositoryInstance: MySQLRepository) {
        this.execute = new Map<string, (string?) => Promise<any>|string>;
        this.initCommand();
    }

    private initCommand() {
        this.execute.set('명단', this.getAllList);
        this.execute.set('생성', this.createTeam);
        this.execute.set('탈퇴', this.leaveTeam);
        this.execute.set('검색', this.searchById);
        this.execute.set('수정', this.editList);
        this.execute.set('도움말', this.getTutorial);
    }

    isCommand(message) {
        if(message[0]==='!') {
            return true;
        }
        return false;
    }

    organizeList(l) {
        let lists = [];
        for(let i=0;l.length;i++) {
            lists.push();
        }
        return l;
    }

    private getAllList = async (): Promise<any> => {
        const sql = `SELECT * FROM PARTIES;`;
        let list = await this.repositoryInstance.executeQuery(sql);
        // list = this.organizeList(list);
        JSON.stringify(list);
        console.log('list:', list[0]);
        for(let i=0;list.length;i++) {
            console.log(list[i].id);
            console.log(list[i].title);
            console.log(list[i].limit);
        }
        return list[0];
    }

    async createTeam(message) {
        console.log('createTeam:', message);
        const sql = `INSERT INTO Parties (id, title) VALUES ((SELECT MIN(p1.id+1) FROM Parties p1 LEFT JOIN Parties p2 ON p1.id+1 = p2.id WHERE p2.id IS NULL), ?);`;
        // let title = title ?? 'prac';
        // let limit = limit ?? '';
        let title = 'prac'; 
        let time = '';
        let limit;
        const values = [title];
        return await this.repositoryInstance.executeQuery(sql, values);
    }

    async leaveTeam() {
        return 'leave team';
    }

    async searchById() {
        return 'search by id';
    }

    async editList() {
        return 'edit list';
    }

    getTutorial(){
        return `
            • 전체 명단 보기 
            !명단 
            
            • 팀 생성 
            !생성 명단_이름

            • 팀 탈퇴
            !탈퇴 명단_번호 멤버_번호

            • 등록된 팀 검색
            !검색

            • 수정
            !수정 명단_번호 멤버_번호 아이디
        `;
    }

    analyzeCommand(message) {
        let cmd = '';
        for(let i=1;i<message.length;i++) {
            if(message[i]===' ') {
                break;
            }
            cmd = cmd.concat(message[i]);
        }
        return cmd;
    }

    async executeCommand(message) {
        const cmd = this.analyzeCommand(message);
        const chatBotMessage = await this.execute.get(cmd)(message);
        return chatBotMessage;
    }

}
