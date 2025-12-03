import React,{useState} from 'react';
export default function AddTask({onAdd}){
  const [title,set]=useState('');
  return(<form onSubmit={e=>{e.preventDefault();onAdd(title);set('')}}>
    <input value={title} onChange={e=>set(e.target.value)} placeholder="Task"/>
    <button>Add</button>
  </form>);
}
