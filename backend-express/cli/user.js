//set environment
require('dotenv').config();

//load cli module
const {program} = require('commander');
const inquirer = require('inquirer');

//load db module
const {Mysql} = require('#database/Mysql');

//set database
const db = new Mysql(
  process.env.MYSQL_HOST,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_PORT
);

//load helpers module
const userHelper = require('#helpers/user')(db);

(async () => {
  //set vars: regexp
  const regexpBlank = /\s/g;
  
  /**
   * 사용자 추가 cli
   */
  program.command('add')
    .description('사용자 추가')
    .action(async () => {
      //set vars: interactive cli config
      const promptInfo = [
        {
          type: 'input',
          name: 'userId',
          message: '사용자ID:',
          validate: async (input) => {
            if (!input) return '사용자ID를 입력해주세요.';
            if (regexpBlank.test(input)) return '사용자ID에는 공백을 사용할 수 없습니다.';
            if (input.length < 4) return '사용자ID는 4자 이상으로 만들어주세요.';
            if (input.length > 100) return '사용자ID는 100자 이하로 만들어주세요.';
            
            const rsHas = await db.exists(db.queryBuilder()
              .from('users')
              .where('id', input)
            );
            if (rsHas) return '이미 존재하는 사용자ID입니다.';
            
            return true;
          }
        },
        {
          type: 'password',
          name: 'password',
          message: '비밀번호:',
          validate: async (input) => {
            if (!input) return '비밀번호를 입력해주세요.';
            if (regexpBlank.test(input)) return '비밀번호에는 공백을 사용할 수 없습니다.';
            if (input.length < 6) return '비밀번호는 6자 이상으로 만들어주세요.';
            if (input.length > 50) return '비밀번호는 50자 이하로 만들어주세요.';
            
            return true;
          }
        },
        {
          type: 'input',
          name: 'name',
          message: '이름:',
          validate: async (input) => {
            if (!input) return '이름을 입력해주세요.';
            
            input = input.trim();
            if (input.length > 50) return '이름은 50자 이하로 만들어주세요.';
            
            return true;
          }
        }
      ];
      
      //set vars: argument
      const {userId, password, name} = await inquirer.prompt(promptInfo);
      
      //insert user data
      try {
        //set vars: encrypt password
        const encryptPassword = userHelper.encryptPassword(password);
        
        await db.execute(db.queryBuilder()
          .insert({
            id: userId,
            password: encryptPassword.hashedPassword,
            password_slat: encryptPassword.salt,
            name: name,
          })
          .into('users')
        );
        
        console.info('사용자 추가 완료');
      } catch (err) {
        console.error(err);
      }
      
      process.exit();
    });
  
  /**
   * 비밀번호 변경 cli
   */
  program.command('change-password')
    .description('비밀번호 변경')
    .action(async () => {
      //set vars: interactive cli config
      const promptInfo = [
        {
          type: 'input',
          name: 'userId',
          message: '사용자ID:',
          validate: async (input) => {
            if (!input) return '사용자ID를 입력해주세요.';
            if (regexpBlank.test(input)) return '사용자ID에는 공백을 사용할 수 없습니다.';
    
            const rsHas = await db.exists(db.queryBuilder()
              .from('users')
              .where('id', input));
            if (!rsHas) return '존재하지 않는 사용자ID입니다.';
    
            return true;
          }
        },
        {
          type: 'password',
          name: 'password',
          message: '변경할 비밀번호:',
          validate: async (input) => {
            if (!input) return '비밀번호를 입력해주세요.';
            if (regexpBlank.test(input)) return '비밀번호에는 공백을 사용할 수 없습니다.';
            if (input.length < 6) return '비밀번호는 6자 이상으로 만들어주세요.';
            if (input.length > 50) return '비밀번호는 50자 이하로 만들어주세요.';
    
            return true;
          }
        }
      ]
  
      //set vars: argument
      const {userId, password} = await inquirer.prompt(promptInfo);
  
      //update password
      try {
        //set vars: user data
        const userIdx = await db.queryScalar(db.queryBuilder()
          .select('user_idx')
          .from('users')
          .where('id', userId)
        );
        
        //set vars: encrypt password
        const encryptPassword = userHelper.encryptPassword(password);
        
        //update password
        await db.execute(db.queryBuilder()
          .update({
            password: encryptPassword.hashedPassword,
            password_salt: encryptPassword.salt
          })
          .from('users')
          .where('user_idx', userIdx));
    
        console.info('비밀번호 변경 완료');
      } catch (err) {
        console.error(err);
      }
  
      process.exit();
    });
  
  await program.parseAsync(process.argv);
})();