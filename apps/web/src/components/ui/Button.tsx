export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      {...props} 
      className={`btn-gradient px-4.5 py-2 rounded-lg transition duration-150 hover:brightness-105 ${props.className||""}`} 
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      {...props} 
      className={`px-4.5 py-2 rounded-lg border border-stroke text-2 hover:bg-white/5 transition ${props.className||""}`} 
    />
  );
}