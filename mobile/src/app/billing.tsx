import React, { useCallback, useState } from "react";
import PatientPortalSection from "../components/PatientPortalSection";
import { useAuth } from "../context/AuthContext";

import { ActivityIndicator, Alert, FlatList, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { createBill, getAppointments, getBilling, getDoctors, getPatients } from "../api/api";

function Billing(){
 const [items,setItems]=useState<any[]>([]),[show,setShow]=useState(false),[saving,setSaving]=useState(false),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false);
 const [form,setForm]=useState({patient:"",doctor:"",appointment:"",consultationFee:"0",additionalCharges:"0",discount:"0",tax:"0",paidAmount:"0",paymentMethod:"cash",paymentDate:"",notes:""});
 const [patients,setPatients]=useState<any[]>([]),[doctors,setDoctors]=useState<any[]>([]),[appointments,setAppointments]=useState<any[]>([]);
 const set=(k:string,v:string)=>setForm(x=>({...x,[k]:v}));
 const load=async()=>{try{setLoading(true);const [b,p,d,a]=await Promise.all([getBilling(),getPatients(),getDoctors(),getAppointments()]);setItems(b);setPatients(p);setDoctors(d);setAppointments(a)}catch(e:any){Alert.alert("Billing",e?.response?.data?.message||"Unable to load billing.")}finally{setLoading(false);setRefreshing(false)}};
 useFocusEffect(useCallback(()=>{load()},[]));
 const total=Number(form.consultationFee||0)+Number(form.additionalCharges||0)-Number(form.discount||0)+Number(form.tax||0);
 const save=async()=>{if(!form.patient||!form.doctor||!form.appointment){Alert.alert("Validation","Patient, doctor and appointment are required.");return}if(Number(form.paidAmount)>total){Alert.alert("Validation","Paid amount cannot exceed total.");return}try{setSaving(true);await createBill({...form,consultationFee:Number(form.consultationFee||0),additionalCharges:Number(form.additionalCharges||0),discount:Number(form.discount||0),tax:Number(form.tax||0),paidAmount:Number(form.paidAmount||0),paymentDate:form.paymentDate||undefined});setShow(false);await load();Alert.alert("Success","Billing record created successfully.")}catch(e:any){Alert.alert("Billing",e?.response?.data?.message||"Unable to create billing record.")}finally{setSaving(false)}};
 if(show)return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.c}><Text style={s.t}>New Invoice</Text><Text style={s.sub}>Billing and payment</Text>{["patient","doctor","appointment","consultationFee","additionalCharges","discount","tax","paidAmount","paymentMethod","paymentDate","notes"].map(k=><View key={k}><Text style={s.l}>{k.charAt(0).toUpperCase()+k.slice(1)}</Text><TextInput keyboardType={["consultationFee","additionalCharges","discount","tax","paidAmount"].includes(k)?"numeric":"default"} style={[s.i,k==="notes"&&{height:80}]} multiline={k==="notes"} value={(form as any)[k]} onChangeText={v=>set(k,v)} placeholder={["patient","doctor","appointment"].includes(k)?"Paste ID":k==="paymentDate"?"YYYY-MM-DD":k} placeholderTextColor="#98A2B3"/></View>)}<View style={s.total}><Text style={s.totalLabel}>Calculated Total</Text><Text style={s.totalValue}>₹{Math.max(total,0).toLocaleString("en-IN")}</Text></View><Text style={s.hint}>{patients.length} patients • {doctors.length} doctors • {appointments.length} appointments loaded.</Text><TouchableOpacity style={s.p} onPress={save} disabled={saving}>{saving?<ActivityIndicator color="#fff"/>:<Text style={s.pt}>Create Invoice</Text>}</TouchableOpacity><TouchableOpacity style={s.sec} onPress={()=>setShow(false)}><Text style={s.st}>Cancel</Text></TouchableOpacity></ScrollView></SafeAreaView>;
 return <SafeAreaView style={s.safe}><View style={s.c}><View style={s.row}><View><Text style={s.t}>Billing</Text><Text style={s.sub}>{items.length} invoices</Text></View><TouchableOpacity style={s.small} onPress={()=>setShow(true)}><Text style={s.pt}>+ New</Text></TouchableOpacity></View>{loading?<ActivityIndicator color="#315FEF" style={{marginTop:40}}/>:<FlatList data={items} keyExtractor={x=>x._id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load()}}/>} renderItem={({item})=><View style={s.card}><Text style={s.ct}>{item.invoiceNumber||"Invoice"}</Text><Text style={s.m}>{item.patient?.name||"Patient"} • {item.doctor?.user?.name||item.doctor?.name||"Doctor"}</Text><Text style={s.amount}>₹{Number(item.totalAmount||0).toLocaleString("en-IN")}</Text><Text style={s.m}>Paid ₹{Number(item.paidAmount||0).toLocaleString("en-IN")} • {item.paymentStatus||"pending"}</Text></View>} ListEmptyComponent={<Text style={s.empty}>No invoices found.</Text>}/>}</View></SafeAreaView>
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#F5F7FB"},c:{padding:18,paddingBottom:40,flexGrow:1},t:{fontSize:28,fontWeight:"900",color:"#172033"},sub:{fontSize:13,color:"#7B8798",marginBottom:15},row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:15},l:{fontSize:12,fontWeight:"800",color:"#4B5565",marginTop:6,marginBottom:6},i:{backgroundColor:"#fff",borderWidth:1,borderColor:"#E5EAF1",borderRadius:12,height:48,paddingHorizontal:14,color:"#172033",marginBottom:8},hint:{fontSize:11,color:"#7B8798",marginVertical:8},total:{backgroundColor:"#E8EEFF",borderRadius:14,padding:14,marginVertical:8},totalLabel:{fontSize:12,color:"#52617A"},totalValue:{fontSize:22,fontWeight:"900",color:"#315FEF",marginTop:4},p:{height:50,borderRadius:12,backgroundColor:"#315FEF",alignItems:"center",justifyContent:"center",marginTop:10},pt:{color:"#fff",fontWeight:"900"},sec:{height:50,borderRadius:12,backgroundColor:"#E9EDF4",alignItems:"center",justifyContent:"center",marginTop:10},st:{color:"#334155",fontWeight:"800"},small:{backgroundColor:"#315FEF",paddingHorizontal:15,paddingVertical:11,borderRadius:11},card:{backgroundColor:"#fff",borderRadius:16,padding:15,marginBottom:10},ct:{fontSize:15,fontWeight:"900",color:"#172033"},m:{fontSize:12,color:"#7B8798",marginTop:4},amount:{fontSize:19,fontWeight:"900",color:"#172033",marginTop:6},empty:{textAlign:"center",marginTop:40,color:"#7B8798"}})


export default function BillingScreen() {
  const role = useAuthRole();
  if (role === "patient") return <PatientPortalSection section="billing" />;
  return <Billing />;
}

function useAuthRole() {
  const { user } = useAuth();
  return String(user?.role || "").toLowerCase();
}
