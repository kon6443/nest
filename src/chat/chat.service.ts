import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatService {

    private readonly execute = new Map<string, () => string>; 

    constructor() {
        this.execute = new Map<string, () => string>;
        this.initCommand();
    }

    private initCommand() {
        this.execute.set('명단', this.getAllList);
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

    getAllList() {
        return 'lists';
    }

    leaveTeam() {
        return 'leave team';
    }

    searchById() {
        return 'search by id';
    }

    editList() {
        return 'edit list';
    }

    getTutorial(){
        return `
            • 전체 명단 보기 
            !명단 
            
            • 팀 탈퇴
            !탈퇴

            • 등록된 팀 검색
            !검색

            • 수정
            !수정
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

    executeCommand(message) {
        const cmd = this.analyzeCommand(message);
        const chatBotMessage = this.execute.get(cmd)();
        return chatBotMessage;
    }

}
