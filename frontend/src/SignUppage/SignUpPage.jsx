import styles from "./SignUpPage.module.css";
import { Link } from "react-router-dom";
import { useState } from "react";

const SignUpPage = () => {
    const [pwd1,setpwd1] = useState("");
    const [pwd2,setpwd2] = useState("");

    const [same,setsame] = useState(true);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function handlepwd1Changer(event){
    setpwd1(event.target.value);
  }

  function handlepwd2Changer(event){
    setpwd2(event.target.value);

    if(pwd1==event.target.value){
     
      setsame(true);
    }
    else{
      setsame(false);
    }
  }
  return (
    <div className={styles.container}>
    <form className={styles.form_main}>
      <p className={styles.heading}>Sign Up</p>

      <div className={styles.inputContainer}>
        <svg
          viewBox="0 0 16 16"
          fill="#2e2e2e"
          height="16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.inputIcon}
        >
          <path d="M13.106 7.222c0-2.967-2.249-5.032-5.482-5.032-3.35 0-5.646 2.318-5.646 5.702 0 3.493 2.235 5.708 5.762 5.708.862 0 1.689-.123 2.304-.335v-.862c-.43.199-1.354.328-2.29.328-2.926 0-4.813-1.88-4.813-4.798 0-2.844 1.921-4.881 4.594-4.881 2.735 0 4.608 1.688 4.608 4.156 0 1.682-.554 2.769-1.416 2.769-.492 0-.772-.28-.772-.76V5.206H8.923v.834h-.11c-.266-.595-.881-.964-1.6-.964-1.4 0-2.378 1.162-2.378 2.823 0 1.737.957 2.906 2.379 2.906.8 0 1.415-.39 1.709-1.087h.11c.081.67.703 1.148 1.503 1.148 1.572 0 2.57-1.415 2.57-3.643zm-7.177.704c0-1.197.54-1.907 1.456-1.907.93 0 1.524.738 1.524 1.907S8.308 9.84 7.371 9.84c-.895 0-1.442-.725-1.442-1.914z" />
        </svg>

        <input
          placeholder="Username"
          id="username"
          className={styles.inputField}
          type="text"
        />
      </div>

      <div className={styles.inputContainer}>
        <svg
    viewBox="0 0 16 16"
    fill="#2e2e2e"
    height="16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.inputIcon}
        >
    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-.5a.5.5 0 0 0-.5.5v.217l6.174 3.557a.5.5 0 0 0 .652 0L14.5 4.217V4a.5.5 0 0 0-.5-.5H2zm12.5 2.383-4.708 2.714 4.708 2.714V5.883zm-.534 6.12L9.058 9.278 8.326 9.7a1.5 1.5 0 0 1-1.652 0l-.732-.422-4.708 2.725A.5.5 0 0 0 2 12.5h12a.5.5 0 0 0 .466-.497zM1.5 11.311l4.708-2.714L1.5 5.883v5.428z" />
  </svg>

  <input
    placeholder="Email"
    id="email"
    className={styles.inputField}
    type="email"
  />
</div>


      <div className={styles.inputContainer}>
        <svg
          viewBox="0 0 16 16"
          fill="#2e2e2e"
          height="16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.inputIcon}
        >
          <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
        </svg>

        <input
          placeholder="Password"
          id="password"
          className={styles.inputField}
          type={showPassword ? "text" : "password"}
          value={pwd1}
          onChange={handlepwd1Changer}
        />
        <span
    className={styles.eyeIcon}
    onClick={() => setShowPassword(prev => !prev)}
  >
    {showPassword ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="#444" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="3" stroke="#444" strokeWidth="1.5"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 3l18 18" stroke="#444" strokeWidth="1.5"/>
        <path d="M2 12s4-7 10-7c2 0 3.8.7 5.3 1.7M22 12s-4 7-10 7c-2 0-3.8-.7-5.3-1.7" stroke="#444" strokeWidth="1.5"/>
      </svg>
    )}
  </span>
      </div>

      <div className={styles.inputContainer}>
  <svg
    viewBox="0 0 16 16"
    fill="#2e2e2e"
    height="16"
    width="16"
    xmlns="http://www.w3.org/2000/svg"
    className={styles.inputIcon}
  >
    <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
  </svg>

  <input
    placeholder="Re-enter Password"
    id="confirmPassword"
    className={styles.inputField}
    type={showConfirmPassword ? "text" : "password"}
    value={pwd2}
    onChange={handlepwd2Changer}
  />
   <span
    className={styles.eyeIcon}
    onClick={() => setShowConfirmPassword(prev => !prev)}
  >
    {showConfirmPassword ? (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" stroke="#444" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="3" stroke="#444" strokeWidth="1.5"/>
      </svg>
    ) : (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 3l18 18" stroke="#444" strokeWidth="1.5"/>
        <path d="M2 12s4-7 10-7c2 0 3.8.7 5.3 1.7M22 12s-4 7-10 7c-2 0-3.8-.7-5.3-1.7" stroke="#444" strokeWidth="1.5"/>
      </svg>
    )}
  </span>
 </div>

{!same && <p className={styles.error}>Passwords do not match</p>}


      <button className={styles.button}>Sign up</button>

      <div className={styles.signupContainer}>
        <p>Already have an account?</p>
        <Link to="/login">Login</Link>
      </div>
    </form>
    </div>
  );
};

export default SignUpPage;
