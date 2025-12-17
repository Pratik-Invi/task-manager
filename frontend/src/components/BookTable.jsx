import React, { useState, useEffect } from 'react';

export default function BookTable(){
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(()=>{
    async function fetchBooks(){
      try{
        const r = await fetch('/api/books');
        const data = await r.json();
        setBooks(data);
      }catch(e){
        console.error('Failed to fetch books', e);
      }finally{
        setLoading(false);
      }
    }
    fetchBooks();
  },[]);

  async function updateStatus(id, status){
    setUpdating(u=>({ ...u, [id]: true }));
    try{
      const r = await fetch(`/api/books/${id}`,{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({status})
      });
      if(!r.ok){
        const err = await r.json().catch(()=>({}));
        throw new Error(err.error || 'Failed to update');
      }
      const updated = await r.json();
      setBooks(bs => bs.map(b => b.id === updated.id ? updated : b));
    }catch(e){
      console.error(e);
      alert('Could not update book status');
    }finally{
      setUpdating(u=>({ ...u, [id]: false }));
    }
  }

  const STATUS_OPTIONS = ['Interested','Not interested','To Read','Reading','Completed'];

  return (
    <div style={{marginTop:32}}>
      <h2>Books</h2>
      {loading ? (
        <div>Loading books…</div>
      ) : (
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{textAlign:'left',borderBottom:'1px solid #ddd'}}>
              <th style={{padding:'8px'}}>Title</th>
              <th style={{padding:'8px'}}>Status</th>
            </tr>
          </thead>
          <tbody>
            {books.map(b=> (
              <tr key={b.id} style={{borderBottom:'1px solid #f1f1f1'}}>
                <td style={{padding:'8px'}}>{b.title}</td>
                <td style={{padding:'8px'}}>
                  <select value={b.status} onChange={(e)=>updateStatus(b.id,e.target.value)} disabled={!!updating[b.id]}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {updating[b.id] && <span style={{marginLeft:8,color:'#666'}}> Saving…</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
