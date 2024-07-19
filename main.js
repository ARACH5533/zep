function splitArgs(argsText){
    let args=[];let arg="";
    const TOKENS=[
        ["'", '"', "[", "{", "("],//start
        ["'", '"', "]", "}", ")"],//end
    ]
    let token=-1;//TOKENS index
    Array.from(argsText).forEach((char)=>{
        if(char===' '){
            if(token===-1) if(arg.length>0){args.push(arg); arg="";}
            else arg+=char;
            return;
        }
        if(token===-1 && TOKENS[0].includes(char)){
            token=TOKENS[0].indexOf(char);
            arg+=char;
            return;
        }
        if(token!==-1 && TOKENS[1].includes(char) && TOKENS[1].indexOf(char)===token){
            token=-1;
            arg+=char;
            return;
        }
        arg+=char;
    });
    if(arg.length>0) args.push(arg);
    return args;
}
/**
 * 
 * @param {ScriptPlayer} player zep-script player
 * @param {Function} afterEnd (player,time)=>{}
 * @param  {...Object} chat {chat:"",time:"",callback: (player,index,time)=>{}}
 */
function dialoger(player,afterEnd,...chat){
    let time=0;
    let ct=3000;
    chat.forEach((item,ind)=>{
        if(!isNaN(item.time))ct=item.time;
        const TIME=time;
        const CT=ct;
        setTimeout(()=>{
            if(!!item.chat) player.showCenterLabel(typeof(item.chat)==='string'?item.chat:item.chat(player,ind,TIME),item.color?? 0xFFFFFF, item.bgcolor??0x000000, item.offset??0/*offset */, CT);
            if(!!item.callback) item.callback(player,ind,TIME);
        },TIME);
        time+=ct;
    });
    setTimeout(()=>{
        afterEnd(player,time);
    },time);
}



App.onSay.Add(function(player, text) {
    if(player.role!==3001)return;
    if(!text.startsWith('!'))return;
    let args=splitArgs(text.substring(1));
    let cmd=args.shift();
    if(cmd==='eval'){
        eval(args.join(" "));//_ !eval App.showCenterLabel("test", 0xFFFFFF, 0x000000, 0);
        return;
    }
    if(cmd==='label'){
        App.showCenterLabel(args.join(" "));
        return;
    }
    if(cmd==='helper'){
        player.sendMessage("eval <script>\nlabel <message>\nhelper <cmd?>",0xFFFFFF);
        return;
    }
    player.sendMessage("명령어가 없습니다.",0xe74856);
});
let Dial=null,setPlay=null;
const dialogs=[
    (plr)=>{
        dialoger(plr,()=>{
            plr.showConfirm(plr.name+"이(가) 맞나요?", (re)=>{
                if(re)
                    Dial(plr,1);
                else plr.showPrompt("그렇다면 닉네임을 다시 입력해 주세요. 닉네임을 변경합니다.", (text)=>{
                    if(!!text) plr.name=text;
                    Dial(plr,1);
                });
            });
        },
        {chat: "안녕하세요! 만나서 반가워요.", time: 1500},
        {chat: "저는 당신의 업무를 도울 인공지능 비서입니다.",time:2000},
        {chat: "당신의 이름이 "+plr.name+"이(가) 맞나요?",time:1400});
    },
    (plr)=>{
        dialoger(plr,()=>{
                plr.showPrompt("어떤 테마로 시작해볼까요?\n1: 자연  2: 도시\n3: 우주",(text)=>{
                    if(text.length===0)text='1';
                    dialoger(plr,()=>{
                    Dial(plr,Number(Array.from(text).find(i=>!isNaN(Number(i))&&0<Number(i)&&Number(i)<4))+1);
                    },{chat: "멋진 선택이에요! 이제 그 테마로 맵을 만들기 시작할게요.",time:3000});
                });
            },
            {chat: "좋아요, 이제 시작해볼까요!", time: 1500},
            {chat: "음, 이곳은 아직 아무것도 없네요.", time: 1500},
            {chat: "먼저 맵을 만들어야 할 것 같아요. 어떤 테마로 시작해볼까요?", time: 4000},
        );
    },
    (plr)=>{//자연 2
        plr.spawnAt(18,103);
        dialoger(plr,()=>{

        },{chat: "맵이 완성되었습니다! 이제 이 맵에 어떤 기능들을 추가하고 싶으신가요?",time: 3000});
    },
    (plr)=>{//도시 3
        plr.spawnAt(18,142);
        dialoger(plr,()=>{
            
        },{chat: "맵이 완성되었습니다! 이제 이 맵에 어떤 기능들을 추가하고 싶으신가요?",time: 3000});
    },
    (plr)=>{//우주 4
        //plr.spawnAt(18,103);
        dialoger(plr,()=>{
            
        },{chat: "맵이 완성되었습니다! 이제 이 맵에 어떤 기능들을 추가하고 싶으신가요?",time: 3000}
        );
    },
];
let chatingPlayers={};//"ID":{step:1,playing:true}
Dial=(plr,step)=>{
    if(!chatingPlayers[plr.id])return;
    chatingPlayers[plr.id].step=step;
    dialogs[step](plr);
};
setPlay=(plr,play)=>{
    if(!chatingPlayers[plr.id])return;
    chatingPlayers[plr.id].playing=play;
};
function isPlaying(plr){
    if(!chatingPlayers[plr.id])return false;
    return chatingPlayers[plr.id].playing;
}
App.onObjectTouched.Add(function (sender, x, y, tileID, obj) {
    if(obj===null){
        //App.sayToAll(`obj is null`, 0xFFFFFF);
        return;
    }
    if (obj.type == ObjectEffectType.INTERACTION_WITH_ZEPSCRIPTS) {
        //App.sayToAll(`Number = ${obj.text}, Value = ${obj.param1}`, 0xFFFFFF);
        if(obj.param1==='chat'){
            if(!!chatingPlayers[sender.id] && !isPlaying(sender)){
                dialogs[chatingPlayers[sender.id].step](sender);
                return;
            }
            chatingPlayers[sender.id]={step:0,playing:true};
            dialogs[0](sender);
        }else if(obj.param1==='out'){
            if(isPlaying(sender)){
                sender.sendMessage('진행도중 종료할 수 없습니다.',0xe74856);
            }else{
                sender.spawnAt(20,12,1);
            }
        }else if(obj.param1==='info'){
            dialoger(sender,()=>{
                    sender.showConfirm("필요하신가요?", (re)=>{
                    if(!re)return;
                    dialoger(sender,()=>{
                            sender.showConfirm("더 세부적인 설명이 필요하신가요?", (re)=>{
                                if(!re)return;
                                dialoger(sender,()=>{
                                },
                                {chat: "이 게임의 디자인은 전부 zep의 무료 에셋을 사용하였고", time:2400},
                                {chat: "나머지 기능적인 부분은 재가 직접 자바스크립트를 이용해 프로그래밍 하였습니다.", time:3000},
                                {chat: "그리고 풍선 인공지능이 좀 더 chatGPT스럽게 말했으면 해서 재가 초본을 잡고 최종적으로 chatGPT가 마무리하였습니다.", time:3500},
                                {chat: "앞으로 더 작업한다면, 게임 컨셉과 디자인 테마를 확실히 잡고 에셋을 직접만들어", time:3000},
                                {chat: "좀 더 통일성있고 심플한 맵 디자인과 함께 zep-script api를 탐구하며", time:2400},
                                {chat: "싱글플레이 퍼즐 어드벤쳐 게임에 더 잘 맞는 게임을 만들고싶습니다.", time:2400},
                                {chat: "여기까지.", time:1000},
                                {chat: "혹시 zep-script 앱의 소스코드가 궁금하시다면 말씀헤주세요.", time:2400},
                                );
                            });
                        },
                        {chat: "이 게임은 미래시대에 프로그래머와 AI가 함깨할때", time:2400},
                        {chat: "생겨날 변화나 일에 대해 담고 있는 게임입니다.", time: 2000},
                        {chat: "매타버스 플렛폼인 zep과 zep에서 재공하는 스크립트 API를 이용해", time: 2500},
                        {chat: "시각뿐 아니라 기능까지 구현한 메타버스 스페이스를 만들고자 했습니다.", time: 2000},
                        {chat: "이 게임은 zep-script api의 한계로 1인용으로 제작되었으며,", time: 2500},
                        {chat: "이 게임의 주인공인 플레이어는 자신의 회사에서 새로 도입한", time: 2500},
                        {chat: "풍선 모양의 인공지능과 대화하며 자신의 세계를 쉽게 창조하고", time: 2500},
                        {chat: "그 과정에서 프로그래머에게 필요한 능력을 일반인도 쉽게 느낄 수 있게 표현한 게임입니다.", time: 3000},
                        {chat: "퍼즐, 어드벤쳐 형식의 스토리가 포함된 게임을 만드려고했지만,", time: 2500},
                        {chat: "주어진 시간이 많지 않아 아직 게임 시스템과 초기 모습밖에 구현이 되지 않은 상태입니다.", time: 2500},
                    );
                    });
                },
                {chat: "이 게임에 대한 설명입니다.", time:2000},
                {chat: "필요하신가요?", time: 1000}
            );
        }
    }
});
App.onLeavePlayer.Add(function(player){
    //setPlay(player,false);
    chatingPlayers[plr.id]=null;
});1
