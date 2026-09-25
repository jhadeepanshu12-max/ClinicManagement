import React, { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, UserRound, ShieldCheck } from "lucide-react-native";
import { registerPatient } from "../api/api";
import { useAuth } from "../context/AuthContext";

const C={navy:"#0B1736",blue:"#315FEF",bg:"#F5F7FB",white:"#fff",text:"#172033",muted:"#7B8798",border:"#E5EAF1",soft:"#E8EEFF"};
const initial={name:"",email:"",phone:"",password:"",dateOfBirth:"",gender:"",address:"",bloodGroup:"",emergencyContact:""};

export default function PatientRegister(){
 const router=useRouter(); const { login }=useAuth(); const [form,setForm]=useState(initial); const [loading,setLoading]=useState(false);
 const set=(k:keyof typeof initial,v:string)=>setForm(x=>({...x,[k]:v}));
 const submit=async()=>{
  if(!form.name||!form.email||!form.phone||!form.password||!form.dateOfBirth||!form.gender){Alert.alert("Required","Name, email, phone, password, date of birth and gender are required.");return;}
  try{setLoading(true);const result:any=await registerPatient(form);if(result?.token&&result?.user){await login(form.email,form.password);router.replace("/role-dashboard");}else{router.replace({pathname:"/login",params:{role:"patient"}});Alert.alert("Account created","Your patient account has been created. Please sign in.");}}catch(e:any){Alert.alert("Registration failed",e?.response?.data?.message||e?.message||"Unable to create account.");}finally{setLoading(false);}
 };
 return <SafeAreaView style={s.safe}><StatusBar barStyle="dark-content" backgroundColor={C.bg}/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
  <TouchableOpacity style={s.back} onPress={()=>router.replace("/role-selection")}><ArrowLeft size={18} color={C.text}/><Text style={s.backText}>Back to portal selection</Text></TouchableOpacity>
  <View style={s.brandRow}><View style={s.logo}><Text style={s.plus}>+</Text></View><View><Text style={s.brand}>CareSync</Text><Text style={s.brandSub}>CLINIC MANAGEMENT</Text></View></View>
  <View style={s.heading}><Text style={s.eyebrow}>PATIENT REGISTRATION</Text><Text style={s.title}>Create your patient account</Text><Text style={s.subtitle}>Create a secure account to manage appointments, medical records, prescriptions and bills.</Text></View>
  <View style={s.card}>
   <View style={s.cardHead}><View style={s.icon}><UserRound size={21} color={C.blue}/></View><View><Text style={s.cardTitle}>Patient information</Text><Text style={s.cardSub}>All required fields are marked *</Text></View></View>
   {([['name','Full Name *'],['email','Email Address *'],['phone','Phone Number *'],['password','Password *'],['dateOfBirth','Date of Birth (YYYY-MM-DD) *'],['gender','Gender *'],['address','Address'],['bloodGroup','Blood Group'],['emergencyContact','Emergency Contact']] as [keyof typeof initial,string][]).map(([k,l])=><View style={s.field} key={k}><Text style={s.label}>{l}</Text><TextInput style={s.input} value={form[k]} onChangeText={v=>set(k,v)} secureTextEntry={k==='password'} keyboardType={k==='phone'?'phone-pad':k==='email'?'email-address':'default'} placeholder={l.replace(' *','')} placeholderTextColor="#A0A9B8"/></View>)}
   <TouchableOpacity style={s.primary} onPress={submit} disabled={loading}>{loading?<ActivityIndicator color="#fff"/>:<Text style={s.primaryText}>Create Patient Account</Text>}</TouchableOpacity>
   <TouchableOpacity style={s.secondary} onPress={()=>router.replace({pathname:"/login",params:{role:"patient"}})}><Text style={s.secondaryText}>Already have an account? Sign in</Text></TouchableOpacity>
  </View>
  <View style={s.security}><ShieldCheck size={17} color={C.blue}/><Text style={s.securityText}>Your account is protected by secure authentication and role-based access.</Text></View>
 </ScrollView></KeyboardAvoidingView></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:C.bg},content:{padding:20,paddingBottom:40},back:{flexDirection:'row',alignItems:'center',gap:7,marginBottom:22},backText:{fontSize:13,fontWeight:'800',color:C.text},brandRow:{flexDirection:'row',alignItems:'center',gap:10},logo:{width:42,height:42,borderRadius:13,backgroundColor:C.blue,alignItems:'center',justifyContent:'center'},plus:{color:C.white,fontSize:28,fontWeight:'900'},brand:{fontSize:20,fontWeight:'900',color:C.text},brandSub:{fontSize:9,fontWeight:'800',letterSpacing:1.2,color:C.muted},heading:{marginTop:28,marginBottom:18},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:C.blue},title:{fontSize:28,fontWeight:'900',color:C.text,marginTop:6},subtitle:{fontSize:13,lineHeight:20,color:C.muted,marginTop:7},card:{backgroundColor:C.white,borderWidth:1,borderColor:C.border,borderRadius:20,padding:18},cardHead:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:12},icon:{width:44,height:44,borderRadius:14,backgroundColor:C.soft,alignItems:'center',justifyContent:'center'},cardTitle:{fontSize:16,fontWeight:'900',color:C.text},cardSub:{fontSize:11,color:C.muted,marginTop:2},field:{marginTop:11},label:{fontSize:12,fontWeight:'800',color:'#475467',marginBottom:6},input:{height:50,borderWidth:1,borderColor:C.border,borderRadius:12,paddingHorizontal:13,color:C.text,backgroundColor:'#FCFDFE'},primary:{height:52,borderRadius:12,backgroundColor:C.blue,alignItems:'center',justifyContent:'center',marginTop:18},primaryText:{color:C.white,fontWeight:'900',fontSize:15},secondary:{alignItems:'center',paddingVertical:14},secondaryText:{color:C.blue,fontWeight:'800',fontSize:13},security:{flexDirection:'row',alignItems:'center',gap:8,marginTop:18,padding:14,backgroundColor:'#EEF4FF',borderRadius:13},securityText:{flex:1,fontSize:11,color:'#516174',lineHeight:17}});
