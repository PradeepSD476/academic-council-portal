import { useState } from "react"

const Editor=(post)=>{
    const {title,setTitle}=useState(post.title);
    const {description,setDescription}=useState(post.description);
    const {expType,setExpType}=useState(post.experienceType);

    return (
        <div>
            <label>Title</label>
            <input type="text" placeholder="Title" value={title}/>

            <label>Description</label>
            <input type="textarea" placeholder="Description" value={description}/>

            <label>Experience Type</label>
            <input type="text" placeholder="Experience Type" value={expType}/>

            <label>Title</label>
            <input type="text" placeholder="Title" value={title}/>

            <button>Save as Draft</button>
            <button>Publish</button>
        </div>
    )
}

export default Editor